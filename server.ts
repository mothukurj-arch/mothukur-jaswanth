import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { extractText } from "unpdf";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_NOTES_CHARS = 100_000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PDF_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";
    if (!isPdfMime && !isPdfExt) {
      cb(new Error("Please upload a valid PDF file (.pdf)."));
      return;
    }
    cb(null, true);
  },
});

interface RawMcq {
  question?: unknown;
  options?: unknown;
  correctIndex?: unknown;
  explanation?: unknown;
}

interface RawKeyTerm {
  term?: unknown;
  meaning?: unknown;
}

interface RawRevisionPack {
  summary?: unknown;
  mcqs?: unknown;
  keyTerms?: unknown;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add it in Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function extractPdfText(buffer: Buffer): Promise<{ text: string; totalPages: number }> {
  try {
    const result = await extractText(new Uint8Array(buffer), { mergePages: true });
    const text = (result.text ?? "").trim();
    if (!text) {
      throw new Error(
        "No readable text was found in this PDF. It may be a scanned image PDF—try pasting your notes instead."
      );
    }
    return {
      text,
      totalPages: result.totalPages ?? 0,
    };
  } catch (err) {
    if (err instanceof Error && err.message.includes("No readable text")) {
      throw err;
    }
    throw new Error(
      "Could not read the uploaded PDF file. Please verify it is not password-protected or corrupted."
    );
  }
}

function normalizeRevisionPack(raw: RawRevisionPack) {
  const summary = Array.isArray(raw.summary)
    ? raw.summary
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const mcqs = Array.isArray(raw.mcqs)
    ? raw.mcqs
        .slice(0, 5)
        .map((item: RawMcq) => {
          const question = typeof item?.question === "string" ? item.question.trim() : "";
          const options = Array.isArray(item?.options)
            ? item.options
                .map((opt) => (typeof opt === "string" ? opt.trim() : ""))
                .filter(Boolean)
                .slice(0, 4)
            : [];
          const rawIdx =
            typeof item?.correctIndex === "number" ? Math.trunc(item.correctIndex) : 0;
          const correctIndex =
            rawIdx >= 0 && rawIdx < options.length ? rawIdx : 0;
          const explanation =
            typeof item?.explanation === "string" ? item.explanation.trim() : "";
          return {
            question,
            options,
            correctIndex,
            explanation,
          };
        })
        .filter((q) => q.question && q.options.length === 4)
    : [];

  const keyTerms = Array.isArray(raw.keyTerms)
    ? raw.keyTerms
        .slice(0, 3)
        .map((item: RawKeyTerm) => ({
          term: typeof item?.term === "string" ? item.term.trim() : "",
          meaning: typeof item?.meaning === "string" ? item.meaning.trim() : "",
        }))
        .filter((t) => t.term && t.meaning)
    : [];

  if (summary.length < 5 || mcqs.length < 5 || keyTerms.length < 3) {
    throw new Error(
      "The generated revision pack was incomplete. Please add a bit more detail to your notes and try again."
    );
  }

  return { summary, mcqs, keyTerms };
}

function formatApiError(err: unknown): { status: number; message: string } {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return { status: 400, message: "PDF file must be 10 MB or smaller." };
    }
    return { status: 400, message: err.message };
  }

  const rawMessage = err instanceof Error ? err.message : "Unexpected server error.";

  if (rawMessage.includes("Please upload a valid PDF") || rawMessage.includes("readable text") || rawMessage.includes("Could not read the uploaded PDF")) {
    return { status: 400, message: rawMessage };
  }

  if (rawMessage.includes("GEMINI_API_KEY is not configured")) {
    return { status: 500, message: rawMessage };
  }

  if (rawMessage.includes("API_KEY_INVALID") || rawMessage.includes("PERMISSION_DENIED") || rawMessage.includes("403")) {
    return {
      status: 403,
      message: "Your Gemini API key appears invalid or lacks permission. Please verify GEMINI_API_KEY in Settings > Secrets.",
    };
  }

  if (rawMessage.includes("RESOURCE_EXHAUSTED") || rawMessage.includes("429")) {
    return {
      status: 429,
      message: "Gemini API rate limit reached. Please wait a moment and try again.",
    };
  }

  return {
    status: 500,
    message: rawMessage || "Failed to generate revision pack. Please try again.",
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
    upload.single("pdf")(req, res, (err) => {
      if (err) {
        const formatted = formatApiError(err);
        res.status(formatted.status).json({ error: formatted.message });
        return;
      }
      next();
    });
  };

  app.post(
    "/api/generate-revision-pack",
    uploadMiddleware,
    async (req: Request, res: Response) => {
      try {
        const pastedNotes =
          typeof req.body?.notes === "string" ? req.body.notes.trim() : "";

        let pdfText = "";
        let pdfPages = 0;
        let pdfFileName: string | null = null;

        if (req.file) {
          pdfFileName = req.file.originalname;
          const extracted = await extractPdfText(req.file.buffer);
          pdfText = extracted.text;
          pdfPages = extracted.totalPages;
        }

        const combinedNotes = [pastedNotes, pdfText]
          .filter(Boolean)
          .join("\n\n")
          .trim()
          .slice(0, MAX_NOTES_CHARS);

        if (combinedNotes.length < 30) {
          res.status(400).json({
            error:
              "Please paste at least a short paragraph of study notes or upload a readable PDF file.",
          });
          return;
        }

        const ai = getGeminiClient();

        const response = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: `Analyze the following study notes and generate a complete student revision pack.\n\nStudy Notes:\n"""\n${combinedNotes}\n"""`,
          config: {
            systemInstruction:
              "You are AI Study Buddy, a clear and encouraging tutor for students. " +
              "Generate a revision pack strictly grounded in the provided study notes: " +
              "(1) A summary with 5 to 6 bullet points written in simple, easy-to-understand English. " +
              "(2) Exactly 5 multiple-choice questions based ONLY on facts in the provided notes, each with 4 distinct options, the 0-based index of the single correct option, and a brief 1-sentence explanation citing the idea from the notes. " +
              "(3) Exactly 3 important key terms taken from the notes, each with a simple, student-friendly meaning.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.ARRAY,
                  description: "5 to 6 clear summary bullet points in simple English.",
                  items: { type: Type.STRING },
                },
                mcqs: {
                  type: Type.ARRAY,
                  description:
                    "Exactly 5 multiple-choice questions strictly based on the provided notes.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        description: "Exactly 4 answer choices.",
                        items: { type: Type.STRING },
                      },
                      correctIndex: {
                        type: Type.INTEGER,
                        description: "0-based index (0, 1, 2, or 3) of the correct option.",
                      },
                      explanation: {
                        type: Type.STRING,
                        description: "One short sentence explaining why this answer is correct based on the notes.",
                      },
                    },
                    required: ["question", "options", "correctIndex", "explanation"],
                  },
                },
                keyTerms: {
                  type: Type.ARRAY,
                  description: "Exactly 3 important keywords from the notes and their simple meanings.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      meaning: { type: Type.STRING },
                    },
                    required: ["term", "meaning"],
                  },
                },
              },
              required: ["summary", "mcqs", "keyTerms"],
            },
          },
        });

        const rawJson = (response.text ?? "").trim();
        if (!rawJson) {
          throw new Error("Gemini returned an empty response. Please try again.");
        }

        const parsed = JSON.parse(rawJson) as RawRevisionPack;
        const revisionPack = normalizeRevisionPack(parsed);

        const wordCount = combinedNotes.split(/\s+/).filter(Boolean).length;

        res.json({
          revisionPack,
          sourceStats: {
            wordCount,
            charCount: combinedNotes.length,
            pdfPages,
            pdfFileName,
          },
        });
      } catch (err) {
        const formatted = formatApiError(err);
        res.status(formatted.status).json({ error: formatted.message });
      }
    }
  );

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("/{*path}", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Study Buddy server running at http://localhost:${PORT}`);
  });
}

startServer();
