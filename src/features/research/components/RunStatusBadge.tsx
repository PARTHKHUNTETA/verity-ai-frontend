import { cn } from "@/components/ui/cn";
import type { RunStatus } from "@/types/api";

const styles: Record<RunStatus, string> = {
  queued: "bg-slate-100 text-slate-700",
  running: "bg-brand-50 text-brand-700",
  awaiting_approval: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const labels: Record<RunStatus, string> = {
  queued: "Queued",
  running: "Running",
  awaiting_approval: "Needs approval",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function RunStatusBadge({ status }: { status: RunStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {(status === "running" || status === "queued") && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      )}
      {labels[status]}
    </span>
  );
}
