import { FileText, Loader2, Upload, X } from "lucide-react";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { SAMPLE_NOTES } from "../data/sampleNotes";

interface StudyInputPanelProps {
  notes: string;
  onNotesChange: (value: string) => void;
  pdfFile: File | null;
  onPdfChange: (file: File | null) => void;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function StudyInputPanel({
  notes,
  onNotesChange,
  pdfFile,
  onPdfChange,
  isLoading,
  error,
  onGenerate,
}: StudyInputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const charCount = notes.length;

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return;
    onPdfChange(file);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelected(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    handleFileSelected(dropped);
  };

  return (
    <section
      id="notes-input"
      aria-labelledby="input-heading"
      className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="input-heading" className="text-xl font-semibold text-slate-900">
            01. Add Your Study Material
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap shrink-0">
            {wordCount} words · {charCount} chars
          </span>
        </div>
        <p className="text-sm text-slate-600">
          Paste lecture notes below, upload a PDF document, or load a sample topic to begin.
        </p>
      </div>

      {/* Quick sample selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-1">
          Try a sample:
        </span>
        {SAMPLE_NOTES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            disabled={isLoading}
            onClick={() => onNotesChange(sample.content)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            {sample.label}
          </button>
        ))}
      </div>

      {/* Study notes textarea */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="study-notes-textarea"
          className="text-sm font-medium text-slate-800"
        >
          Paste Study Notes
        </label>
        <textarea
          id="study-notes-textarea"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={isLoading}
          rows={10}
          placeholder="Paste your textbook chapters, lecture transcripts, or class notes here..."
          className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15 transition-colors resize-y min-h-[220px]"
        />
      </div>

      {/* PDF Upload */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-800">
          Or Upload PDF Notes
        </span>

        {pdfFile ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700 shrink-0">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {pdfFile.name}
                </p>
                <p className="text-xs font-mono tabular-nums text-slate-500">
                  {formatBytes(pdfFile.size)} · PDF ready
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onPdfChange(null)}
              disabled={isLoading}
              aria-label="Remove uploaded PDF"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
              isDragging
                ? "border-sky-600 bg-sky-50"
                : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            <Upload className="h-5 w-5 text-slate-500" aria-hidden="true" />
            <div className="text-sm text-slate-700">
              <span className="font-semibold text-sky-700">Choose a PDF file</span>{" "}
              or drag and drop here
            </div>
            <p className="text-xs text-slate-500">
              Text-based PDFs up to 10 MB
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          className="hidden"
          aria-label="Upload PDF file"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <span className="font-semibold">Unable to process notes: </span>
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-6 py-3.5 text-sm font-semibold text-white hover:bg-sky-800 active:bg-sky-900 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Generating Revision Pack...</span>
          </>
        ) : (
          <span>Generate Revision Pack</span>
        )}
      </button>
    </section>
  );
}
