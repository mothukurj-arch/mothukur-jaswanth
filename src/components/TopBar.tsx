interface TopBarProps {
  hasResult: boolean;
  onReset: () => void;
}

export function TopBar({ hasResult, onReset }: TopBarProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-8 px-6 py-4">
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          AI Study Buddy – Notes to Quiz
        </a>

        <nav
          aria-label="Study sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#notes-input"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Notes Input
          </a>
          <a
            href="#summary-section"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Summary
          </a>
          <a
            href="#quiz-section"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Quiz
          </a>
          <a
            href="#terms-section"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Key Terms
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            {hasResult ? "New Session" : "Clear Notes"}
          </button>
        </div>
      </div>
    </header>
  );
}
