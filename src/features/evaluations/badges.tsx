import { cn } from "@/components/ui/cn";
import type { EvalCaseCategory, EvalRunStatus } from "@/types/api";
import { CATEGORY_LABELS } from "./format";

export function CategoryBadge({ category }: { category: EvalCaseCategory }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        category === "red_team" ? "bg-red-50 text-red-800" : "bg-slate-100 text-slate-700",
      )}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}

const STATUS: Record<EvalRunStatus, { label: string; className: string }> = {
  queued: { label: "Queued", className: "bg-slate-100 text-slate-700" },
  running: { label: "Running", className: "bg-brand-50 text-brand-700" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-800" },
  failed: { label: "Failed", className: "bg-red-50 text-red-800" },
  cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-600" },
};

export function EvalStatusBadge({ status }: { status: EvalRunStatus }) {
  return (
    <span
      className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS[status].className)}
    >
      {STATUS[status].label}
    </span>
  );
}

/** Pass/fail with an icon and a word (never color alone). */
export function PassFail({ passed }: { passed: boolean }) {
  return (
    <span className="text-ink inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap">
      <span aria-hidden="true" className={passed ? "text-status-good" : "text-status-critical"}>
        {passed ? "✓" : "✕"}
      </span>
      {passed ? "Pass" : "Fail"}
    </span>
  );
}
