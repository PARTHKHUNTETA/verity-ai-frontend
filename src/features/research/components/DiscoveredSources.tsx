import { Link } from "react-router";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import type { DiscoveredSource, RunSourceStatus } from "@/types/api";

const STATUS: Record<RunSourceStatus, { label: string; className: string }> = {
  used: { label: "Cited", className: "bg-emerald-50 text-emerald-700" },
  acquired: { label: "Read", className: "bg-brand-50 text-brand-700" },
  candidate: { label: "Not read", className: "bg-slate-100 text-slate-600" },
  rejected: { label: "Skipped", className: "bg-amber-50 text-amber-700" },
  blocked: { label: "Blocked", className: "bg-red-50 text-red-700" },
};

const PROVIDERS: Record<string, string> = {
  tavily: "Web",
  arxiv: "arXiv",
  semantic_scholar: "Semantic Scholar",
  fake: "Test",
};

/**
 * Everything the run found through search, so you can see what it read, what it cited, and
 * what it skipped or blocked, and why.
 */
export function DiscoveredSources({ sources }: { sources: DiscoveredSource[] }) {
  if (sources.length === 0) return null;
  const counts = sources.reduce<Partial<Record<RunSourceStatus, number>>>(
    (acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }),
    {},
  );

  return (
    <Card>
      <div className="border-line flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3">
        <h2 className="text-ink text-sm font-semibold">
          Sources found <span className="text-ink-muted font-normal">({sources.length})</span>
        </h2>
        <p className="text-ink-muted text-xs">
          {(["used", "acquired", "rejected", "blocked"] as const)
            .filter((s) => counts[s])
            .map((s) => `${counts[s]} ${STATUS[s].label.toLowerCase()}`)
            .join(" · ")}
        </p>
      </div>
      <ul className="divide-line divide-y">
        {sources.map((s) => (
          <li key={s.id} className="flex items-start justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-canvas text-ink-muted shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase">
                  {PROVIDERS[s.provider] ?? s.provider}
                </span>
                {s.sourceId ? (
                  <Link
                    to={`/sources/${s.sourceId}`}
                    className="text-ink hover:text-brand-700 truncate text-sm font-medium"
                  >
                    {s.title ?? s.url}
                  </Link>
                ) : (
                  <span className="text-ink truncate text-sm font-medium">{s.title ?? s.url}</span>
                )}
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-ink-subtle hover:text-ink-muted mt-0.5 block truncate text-xs"
              >
                {s.url}
              </a>
              {s.reason && <p className="text-ink-muted mt-1 text-xs">{s.reason}</p>}
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                STATUS[s.status].className,
              )}
            >
              {STATUS[s.status].label}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
