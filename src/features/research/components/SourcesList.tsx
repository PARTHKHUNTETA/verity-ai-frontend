import { Link } from "react-router";
import { Card } from "@/components/ui/Card";
import { formatPages } from "@/services/sources-api";
import type { Citation } from "@/types/api";

/** The passages retrieved for this run, numbered as the answer cites them. */
export function SourcesList({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) return null;
  return (
    <Card>
      <h2 className="border-line text-ink border-b px-5 py-3 text-sm font-semibold">
        Evidence <span className="text-ink-muted font-normal">({citations.length} quotes)</span>
      </h2>
      <ol className="divide-line divide-y">
        {citations.map((c) => (
          <li key={c.evidenceId} className="flex gap-3 px-5 py-3">
            <span className="bg-brand-100 text-brand-700 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded text-[11px] font-semibold">
              {c.number}
            </span>
            <div className="min-w-0">
              <Link
                to={`/sources/${c.sourceId}${c.chunkId ? `?chunk=${c.chunkId}` : ""}`}
                className="text-ink hover:text-brand-700 text-sm font-medium"
              >
                {c.sourceTitle}
              </Link>
              {formatPages(c.pageStart, c.pageEnd) && (
                <span className="text-ink-muted ml-2 text-xs">
                  {formatPages(c.pageStart, c.pageEnd)}
                </span>
              )}
              <p className="text-ink-muted mt-0.5 line-clamp-2 text-xs">{c.quote}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
