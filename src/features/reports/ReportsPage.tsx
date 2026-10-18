import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReportIcon } from "@/components/ui/icons";

export function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" description="Cited research reports produced by your runs." />
      <EmptyState
        icon={<ReportIcon />}
        title="No reports yet"
        description="Every claim in a report links to the evidence behind it. Hover a citation to see the exact quote and source."
        phase="Phase 7"
      />
    </>
  );
}
