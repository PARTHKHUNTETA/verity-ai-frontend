import { cn } from "@/components/ui/cn";
import type { SourceStatus } from "@/types/api";

const styles: Record<SourceStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  processing: "bg-brand-50 text-brand-700",
  ready: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};

const labels: Record<SourceStatus, string> = {
  pending: "Queued",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

export function SourceStatusBadge({ status }: { status: SourceStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}
