import { useState } from "react";
import { RevisionPackView } from "./components/RevisionPackView";
import { StudyInputPanel } from "./components/StudyInputPanel";
import { TopBar } from "./components/TopBar";
import { RevisionPack, SourceStats } from "./types";

interface GenerateResponse {
  revisionPack?: RevisionPack;
  sourceStats?: SourceStats;
  error?: string;
}

export default function App() {
  const [notes, setNotes] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revisionPack, setRevisionPack] = useState<RevisionPack | null>(null);
  const [sourceStats, setSourceStats] = useState<SourceStats | null>(null);
  const [packVersion, setPackVersion] = useState(0);

  const handleGenerate = async () => {
    setError(null);

    if (!notes.trim() && !pdfFile) {
      setError("Please paste your study notes or upload a PDF file first.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("notes", notes);
      if (pdfFile) {
        formData.append("pdf", pdfFile);
      }

      const response = await fetch("/api/generate-revision-pack", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as GenerateResponse;

      if (!response.ok || !data.revisionPack) {
        throw new Error(
          data.error || "Could not generate revision pack. Please try again."
        );
      }

      setRevisionPack(data.revisionPack);
      setSourceStats(data.sourceStats ?? null);
      setPackVersion((v) => v + 1);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Network error while generating your revision pack.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setNotes("");
    setPdfFile(null);
    setError(null);
    setRevisionPack(null);
    setSourceStats(null);
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar hasResult={Boolean(revisionPack)} onReset={handleReset} />

      <main className="mx-auto w-full max-w-[1360px] flex-1 px-6 py-8">
        <div className="mb-8 flex flex-col gap-2 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
            AI Study Buddy – Notes to Quiz
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Turn long study notes or PDF chapters into a simple 5–6 point summary, 5 practice quiz questions with answers, and 3 key terms.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5">
            <StudyInputPanel
              notes={notes}
              onNotesChange={(val) => {
                setNotes(val);
                if (error) setError(null);
              }}
              pdfFile={pdfFile}
              onPdfChange={(file) => {
                setPdfFile(file);
                if (error) setError(null);
              }}
              isLoading={isLoading}
              error={error}
              onGenerate={handleGenerate}
            />
          </div>

          <div className="lg:col-span-7">
            <RevisionPackView
              key={packVersion}
              revisionPack={revisionPack}
              sourceStats={sourceStats}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
