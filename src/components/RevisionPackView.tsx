import {
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  HelpCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { RevisionPack, SectionFilter, SourceStats } from "../types";

interface RevisionPackViewProps {
  revisionPack: RevisionPack | null;
  sourceStats: SourceStats | null;
  isLoading: boolean;
}

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export function RevisionPackView({
  revisionPack,
  sourceStats,
  isLoading,
}: RevisionPackViewProps) {
  const [activeTab, setActiveTab] = useState<SectionFilter>("all");
  const [showAnswers, setShowAnswers] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
  };

  const handleCopySummary = async () => {
    if (!revisionPack) return;
    const text = revisionPack.summary
      .map((point, idx) => `${idx + 1}. ${point}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 1800);
    } catch {
      // Clipboard API unavailable in restricted contexts; ignore silently
    }
  };

  const handleDownloadTxt = () => {
    if (!revisionPack) return;

    const lines: string[] = [
      "AI Study Buddy – Notes to Quiz",
      "==============================",
      "",
      "A. SUMMARY",
      ...revisionPack.summary.map((item, idx) => `${idx + 1}. ${item}`),
      "",
      "B. MULTIPLE CHOICE QUESTIONS",
      "",
    ];

    revisionPack.mcqs.forEach((mcq, qIdx) => {
      lines.push(`Q${qIdx + 1}. ${mcq.question}`);
      mcq.options.forEach((opt, optIdx) => {
        lines.push(`   ${OPTION_LETTERS[optIdx]}. ${opt}`);
      });
      lines.push(
        `   Correct Answer: ${OPTION_LETTERS[mcq.correctIndex]}. ${mcq.options[mcq.correctIndex]}`
      );
      if (mcq.explanation) {
        lines.push(`   Note: ${mcq.explanation}`);
      }
      lines.push("");
    });

    lines.push("C. KEY TERMS");
    revisionPack.keyTerms.forEach((kt, idx) => {
      lines.push(`${idx + 1}. ${kt.term}: ${kt.meaning}`);
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "revision-pack.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <section
        aria-live="polite"
        className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-slate-900">
            Building Your Revision Pack
          </h2>
          <p className="text-sm text-slate-600">
            Extracting key points, writing 5 multiple-choice questions, and defining 3 essential terms from your notes.
          </p>
        </div>

        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-5 w-44 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-11/12 rounded bg-slate-100" />
          <div className="h-4 w-5/6 rounded bg-slate-100" />
          <div className="h-px bg-slate-200 my-2" />
          <div className="h-5 w-52 rounded bg-slate-200" />
          <div className="h-24 w-full rounded-xl bg-slate-100" />
          <div className="h-24 w-full rounded-xl bg-slate-100" />
        </div>
      </section>
    );
  }

  if (!revisionPack) {
    return (
      <section className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            02. Your Revision Pack
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 max-w-xl">
            Paste your study notes or upload a PDF on the left, then click{" "}
            <span className="font-semibold text-slate-800">Generate Revision Pack</span>.
            Everything generated is grounded directly in your material.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono tabular-nums font-medium text-sky-700">
              01
            </span>
            <h3 className="text-base font-semibold text-slate-900">
              Simple Summary
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              5–6 clear bullet points written in everyday English for fast review.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono tabular-nums font-medium text-sky-700">
              02
            </span>
            <h3 className="text-base font-semibold text-slate-900">
              5 Practice MCQs
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Four options per question with verified answers based only on your notes.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono tabular-nums font-medium text-sky-700">
              03
            </span>
            <h3 className="text-base font-semibold text-slate-900">
              3 Key Terms
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Important vocabulary extracted with short, student-friendly meanings.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = revisionPack.mcqs.reduce((acc, mcq, idx) => {
    return selectedAnswers[idx] === mcq.correctIndex ? acc + 1 : acc;
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Output Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-slate-900">
              02. Generated Revision Pack
            </h2>
            {sourceStats && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                <span>{sourceStats.wordCount} source words</span>
                {sourceStats.pdfFileName && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {sourceStats.pdfFileName} ({sourceStats.pdfPages}{" "}
                      {sourceStats.pdfPages === 1 ? "page" : "pages"})
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>{revisionPack.summary.length} summary points</span>
                <span aria-hidden="true">·</span>
                <span>{revisionPack.mcqs.length} MCQs</span>
                <span aria-hidden="true">·</span>
                <span>{revisionPack.keyTerms.length} key terms</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleDownloadTxt}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Download (.txt)</span>
          </button>
        </div>

        {/* Interactive Section Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter revision sections"
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start"
        >
          {(
            [
              { id: "all", label: "All Sections" },
              { id: "summary", label: "Summary" },
              { id: "quiz", label: "MCQs (5)" },
              { id: "terms", label: "Key Terms (3)" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section A: Summary */}
      {(activeTab === "all" || activeTab === "summary") && (
        <section
          id="summary-section"
          aria-labelledby="summary-heading"
          className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 id="summary-heading" className="text-lg font-semibold text-slate-900">
                A. Summary
              </h3>
              <p className="text-xs text-slate-500">
                Key takeaways in simple English
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedSummary ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
          </div>

          <ol className="flex flex-col gap-3">
            {revisionPack.summary.map((point, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-sm leading-relaxed text-slate-800"
              >
                <span className="font-mono tabular-nums text-xs font-semibold text-sky-700 bg-sky-50 rounded-md px-2 py-1 shrink-0 mt-0.5">
                  0{idx + 1}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Section B: Multiple Choice Questions */}
      {(activeTab === "all" || activeTab === "quiz") && (
        <section
          id="quiz-section"
          aria-labelledby="quiz-heading"
          className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 id="quiz-heading" className="text-lg font-semibold text-slate-900">
                B. Multiple Choice Questions
              </h3>
              <p className="text-xs text-slate-500">
                5 questions based strictly on your notes · Click an option to test yourself
              </p>
            </div>

            <div className="flex items-center gap-3">
              {answeredCount > 0 && (
                <span className="text-xs font-mono tabular-nums font-medium text-slate-700">
                  Score: {correctCount} / {revisionPack.mcqs.length}
                </span>
              )}
              {answeredCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetQuiz}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Retry Quiz</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAnswers((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {showAnswers ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Hide Answers</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Show Answers</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col divide-y divide-slate-200">
            {revisionPack.mcqs.map((mcq, qIdx) => {
              const chosenIndex = selectedAnswers[qIdx];
              const hasAnswered = chosenIndex !== undefined;
              const isCorrectChoice = chosenIndex === mcq.correctIndex;

              return (
                <div
                  key={qIdx}
                  className="py-5 first:pt-0 last:pb-0 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono tabular-nums text-xs font-semibold text-slate-500 mt-1 shrink-0">
                      Q{qIdx + 1}.
                    </span>
                    <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                      {mcq.question}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-0 sm:pl-7">
                    {mcq.options.map((optionText, optIdx) => {
                      const isSelected = chosenIndex === optIdx;
                      const isCorrectOption = optIdx === mcq.correctIndex;

                      let buttonStyle =
                        "border-slate-200 bg-slate-50/70 text-slate-800 hover:border-slate-300 hover:bg-slate-100";

                      if (hasAnswered) {
                        if (isSelected && isCorrectChoice) {
                          buttonStyle =
                            "border-emerald-300 bg-emerald-50 text-emerald-950";
                        } else if (isSelected && !isCorrectChoice) {
                          buttonStyle =
                            "border-red-300 bg-red-50 text-red-950";
                        } else if (showAnswers && isCorrectOption) {
                          buttonStyle =
                            "border-emerald-200 bg-emerald-50/60 text-emerald-900";
                        }
                      } else if (showAnswers && isCorrectOption) {
                        buttonStyle =
                          "border-emerald-200 bg-emerald-50/70 text-emerald-950";
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors cursor-pointer ${buttonStyle}`}
                        >
                          <span className="font-mono text-xs font-semibold shrink-0 mt-0.5">
                            {OPTION_LETTERS[optIdx]}.
                          </span>
                          <span className="flex-1 leading-snug">{optionText}</span>
                          {hasAnswered && isSelected && isCorrectChoice && (
                            <CheckCircle2
                              className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5"
                              aria-label="Correct choice"
                            />
                          )}
                          {hasAnswered && isSelected && !isCorrectChoice && (
                            <XCircle
                              className="h-4 w-4 text-red-600 shrink-0 mt-0.5"
                              aria-label="Incorrect choice"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {(showAnswers || hasAnswered) && (
                    <div className="pl-0 sm:pl-7 flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                        <span>
                          Correct Answer: {OPTION_LETTERS[mcq.correctIndex]}.{" "}
                          {mcq.options[mcq.correctIndex]}
                        </span>
                      </div>
                      {mcq.explanation && (
                        <p className="text-slate-600 leading-relaxed flex items-start gap-1.5">
                          <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{mcq.explanation}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section C: Key Terms */}
      {(activeTab === "all" || activeTab === "terms") && (
        <section
          id="terms-section"
          aria-labelledby="terms-heading"
          className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4"
        >
          <div className="border-b border-slate-100 pb-4">
            <h3 id="terms-heading" className="text-lg font-semibold text-slate-900">
              C. Key Terms
            </h3>
            <p className="text-xs text-slate-500">
              3 important keywords with simple meanings
            </p>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {revisionPack.keyTerms.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-1.5 rounded-xl bg-slate-50 p-4"
              >
                <span className="font-mono tabular-nums text-xs font-medium text-sky-700">
                  0{idx + 1}
                </span>
                <dt className="text-base font-semibold text-slate-900">
                  {item.term}
                </dt>
                <dd className="text-sm leading-relaxed text-slate-600">
                  {item.meaning}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
