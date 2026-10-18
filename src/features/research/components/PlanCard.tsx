import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import type { SubQuestion } from "@/types/api";

const COVERAGE: Record<SubQuestion["coverage"], { label: string; className: string }> = {
  answered: { label: "Answered", className: "bg-emerald-50 text-emerald-700" },
  partial: { label: "Evidence, not cited", className: "bg-amber-50 text-amber-700" },
  unanswered: { label: "No evidence", className: "bg-red-50 text-red-700" },
  pending: { label: "In progress", className: "bg-slate-100 text-slate-600" },
};

/** The research plan: sub-questions and whether each ended up answered with evidence. */
export function PlanCard({ subQuestions }: { subQuestions: SubQuestion[] }) {
  if (subQuestions.length === 0) return null;
  return (
    <Card>
      <h2 className="border-line text-ink border-b px-5 py-3 text-sm font-semibold">
        Research plan
      </h2>
      <ol className="divide-line divide-y">
        {subQuestions.map((sq) => (
          <li key={sq.id} className="flex items-start justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              <p className="text-ink text-sm">
                <span className="text-ink-muted mr-1.5 font-semibold">Q{sq.position}</span>
                {sq.text}
              </p>
              {sq.searchQueries.length > 0 && (
                <p className="text-ink-subtle mt-0.5 text-xs">
                  Searched: {sq.searchQueries.map((q) => `“${q}”`).join(", ")}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  COVERAGE[sq.coverage].className,
                )}
              >
                {COVERAGE[sq.coverage].label}
              </span>
              <span className="text-ink-muted text-[11px]">
                {sq.evidenceCount} quote{sq.evidenceCount === 1 ? "" : "s"}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
