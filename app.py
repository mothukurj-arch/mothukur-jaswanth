import json
import re
from typing import Any, Dict, List

import streamlit as st
from google import genai
from google.genai import types
from pypdf import PdfReader


st.set_page_config(
    page_title="AI Study Buddy – Notes to Quiz",
    page_icon="📘",
    layout="wide",
)


def extract_text_from_pdf(uploaded_file) -> str:
    """Extract readable text from an uploaded PDF using PyPDF."""
    try:
        reader = PdfReader(uploaded_file)
        if reader.is_encrypted:
            raise ValueError(
                "This PDF is password-protected. Please unlock it or paste your notes instead."
            )

        pages_text: List[str] = []
        for page in reader.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                pages_text.append(page_text.strip())

        combined = "\n\n".join(pages_text).strip()
        if not combined:
            raise ValueError(
                "No readable text was found in this PDF. It may be a scanned image PDF."
            )
        return combined
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"Could not read the uploaded PDF file: {exc}") from exc


def build_prompt(notes_text: str) -> str:
    return f"""
You are a helpful, student-friendly study tutor.
Analyze ONLY the study notes provided below and create a revision pack.
Do not use outside facts for the multiple choice questions—every question and answer must be strictly based on the provided notes.

Return a valid JSON object matching this exact structure:
{{
  "summary": [
    "Bullet point 1 in simple English",
    "Bullet point 2 in simple English",
    "Bullet point 3 in simple English",
    "Bullet point 4 in simple English",
    "Bullet point 5 in simple English"
  ],
  "mcqs": [
    {{
      "question": "Clear question based only on the notes?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Exact text of the correct option",
      "explanation": "Short 1-sentence explanation from the notes."
    }}
  ],
  "key_terms": [
    {{
      "term": "Keyword 1",
      "meaning": "Simple, student-friendly meaning based on the notes."
    }}
  ]
}}

Strict rules:
1. "summary": Provide 5 to 6 bullet points written in clear, simple English.
2. "mcqs": Provide exactly 5 multiple choice questions, each with exactly 4 options, based ONLY on the provided notes.
3. "key_terms": Provide exactly 3 important keywords from the notes with simple meanings.
4. Output ONLY valid JSON.

Study Notes:
\"\"\"
{notes_text}
\"\"\"
""".strip()


def parse_json_response(raw_text: str) -> Dict[str, Any]:
    """Parse JSON safely even if wrapped in markdown code fences."""
    cleaned = raw_text.strip()
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if fence_match:
        cleaned = fence_match.group(1).strip()
    return json.loads(cleaned)


def generate_revision_pack(notes_text: str) -> Dict[str, Any]:
    """Call Google Gemini API using the key stored in Streamlit secrets."""
    api_key = st.secrets.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY was not found in Streamlit secrets (.streamlit/secrets.toml)."
        )

    client = genai.Client(api_key=api_key)

    trimmed_notes = notes_text.strip()[:100000]
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=build_prompt(trimmed_notes),
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.3,
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response. Please try again.")

    data = parse_json_response(response.text)

    if (
        not isinstance(data.get("summary"), list)
        or not isinstance(data.get("mcqs"), list)
        or not isinstance(data.get("key_terms"), list)
    ):
        raise ValueError("The AI response format was incomplete. Please try again.")

    return data


def main() -> None:
    st.title("AI Study Buddy – Notes to Quiz")
    st.caption(
        "Paste your study notes or upload a PDF to quickly generate a simple summary, 5 quiz questions, and 3 key terms."
    )

    col_input, col_output = st.columns([1, 1.3], gap="large")

    with col_input:
        st.subheader("1. Add Your Study Notes")
        pasted_notes = st.text_area(
            "Paste your study notes here",
            height=240,
            placeholder="Paste lecture notes, textbook paragraphs, or revision outlines...",
        )

        uploaded_pdf = st.file_uploader(
            "Or upload a PDF file",
            type=["pdf"],
            help="Text will be extracted from your PDF using PyPDF.",
        )

        generate_clicked = st.button(
            "Generate Revision Pack",
            type="primary",
            use_container_width=True,
        )

    if generate_clicked:
        combined_parts: List[str] = []

        if pasted_notes and pasted_notes.strip():
            combined_parts.append(pasted_notes.strip())

        if uploaded_pdf is not None:
            try:
                with st.spinner("Reading PDF text..."):
                    pdf_text = extract_text_from_pdf(uploaded_pdf)
                    combined_parts.append(pdf_text)
            except ValueError as err:
                st.error(str(err))
                return

        full_notes = "\n\n".join(combined_parts).strip()

        if len(full_notes) < 30:
            st.warning(
                "Please paste at least a few sentences of study notes or upload a readable PDF before generating."
            )
            return

        try:
            with st.spinner("Analyzing your notes and building your revision pack..."):
                revision_pack = generate_revision_pack(full_notes)
                st.session_state["revision_pack"] = revision_pack
        except json.JSONDecodeError:
            st.error(
                "Could not parse the AI output cleanly. Please click 'Generate Revision Pack' to try again."
            )
        except Exception as exc:
            st.error(f"Unable to generate revision pack: {exc}")

    with col_output:
        st.subheader("2. Your Revision Pack")
        pack = st.session_state.get("revision_pack")

        if not pack:
            st.info(
                "Your 5–6 bullet summary, 5 multiple choice questions with answers, and 3 key terms will appear here."
            )
            return

        # A. Summary
        st.markdown("### A. Summary (Simple English)")
        for idx, bullet in enumerate(pack.get("summary", [])[:6], start=1):
            st.markdown(f"**{idx}.** {bullet}")

        st.divider()

        # B. Multiple Choice Questions
        st.markdown("### B. Multiple Choice Questions")
        option_labels = ["A", "B", "C", "D"]
        for q_idx, mcq in enumerate(pack.get("mcqs", [])[:5], start=1):
            st.markdown(f"**Q{q_idx}. {mcq.get('question', '')}**")
            options = mcq.get("options", [])
            for opt_idx, opt_text in enumerate(options[:4]):
                label = option_labels[opt_idx]
                st.markdown(f"- **{label}.** {opt_text}")

            correct_answer = mcq.get("correct_answer", "")
            explanation = mcq.get("explanation", "")
            st.success(f"Correct Answer: {correct_answer}")
            if explanation:
                st.caption(f"Why: {explanation}")

        st.divider()

        # C. Key Terms
        st.markdown("### C. Key Terms")
        for term_item in pack.get("key_terms", [])[:3]:
            term = term_item.get("term", "")
            meaning = term_item.get("meaning", "")
            st.markdown(f"- **{term}**: {meaning}")


if __name__ == "__main__":
    main()
