import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChartIcon } from "@/components/ui/icons";

export function EvaluationsPage() {
  return (
    <>
      <PageHeader
        title="Evaluations"
        description="How trustworthy are the answers? Scorecards for runs and benchmark datasets."
      />
      <EmptyState
        icon={<ChartIcon />}
        title="No evaluations yet"
        description="Scorecards measure claim support, citation accuracy, source reliability and task completion, per run and across benchmark datasets."
        phase="Phases 10–11"
      />
    </>
  );
}
