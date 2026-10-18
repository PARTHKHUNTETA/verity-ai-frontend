import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SourcesIcon } from "@/components/ui/icons";

export function SourcesPage() {
  return (
    <>
      <PageHeader
        title="Sources"
        description="Collections of papers, reports and documents the agent can search."
      />
      <EmptyState
        icon={<SourcesIcon />}
        title="No collections yet"
        description="Upload PDFs or add URLs into collections. VerityAI indexes them so research answers can cite exact passages."
        phase="Phase 5"
      />
    </>
  );
}
