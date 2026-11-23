export interface McqItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface KeyTermItem {
  term: string;
  meaning: string;
}

export interface RevisionPack {
  summary: string[];
  mcqs: McqItem[];
  keyTerms: KeyTermItem[];
}

export interface SourceStats {
  wordCount: number;
  charCount: number;
  pdfPages: number;
  pdfFileName: string | null;
}

export type SectionFilter = "all" | "summary" | "quiz" | "terms";
