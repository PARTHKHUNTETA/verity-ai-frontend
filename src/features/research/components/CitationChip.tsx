import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import { cn } from "@/components/ui/cn";
import { formatPages } from "@/services/sources-api";
import type { Citation } from "@/types/api";

/**
 * A citation number in the answer. Click it to see the exact passage the model was given,
 * with a link to that passage inside the document.
 */
export function CitationChip({ number, citation }: { number: number; citation?: Citation }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!citation) {
    // The model cited a number it was never given: show it, flagged, instead of hiding it.
    return (
      <span
        title="This citation doesn't match any retrieved passage"
        className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-red-50 px-1 align-super text-[10px] font-semibold text-red-600 no-underline"
      >
        {number}?
      </span>
    );
  }

  const pages = formatPages(citation.pageStart, citation.pageEnd);
  return (
    <span ref={ref} className="not-prose relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={`Citation ${number}: ${citation.sourceTitle}`}
        className={cn(
          "mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded px-1 align-super text-[10px] font-semibold transition-colors",
          open
            ? "bg-brand-600 text-white"
            : "bg-brand-100 text-brand-700 hover:bg-brand-600 hover:text-white",
        )}
      >
        {number}
      </button>
      {open && (
        <span
          id={popoverId}
          role="dialog"
          className="border-line bg-surface absolute left-1/2 z-20 mt-2 block w-80 max-w-[85vw] -translate-x-1/2 rounded-xl border p-4 text-left shadow-lg"
        >
          <span className="text-ink block text-xs font-semibold">
            [{number}] {citation.sourceTitle}
          </span>
          {pages && <span className="text-ink-muted block text-xs">{pages}</span>}
          <span className="border-brand-200 text-ink-muted mt-2 block max-h-48 overflow-y-auto border-l-2 pl-3 text-xs leading-relaxed">
            {citation.quote.length > 700 ? `${citation.quote.slice(0, 700)}…` : citation.quote}
          </span>
          <Link
            to={`/sources/${citation.sourceId}${citation.chunkId ? `?chunk=${citation.chunkId}` : ""}`}
            className="text-brand-600 hover:text-brand-700 mt-3 inline-block text-xs font-medium"
          >
            Open in source →
          </Link>
        </span>
      )}
    </span>
  );
}
