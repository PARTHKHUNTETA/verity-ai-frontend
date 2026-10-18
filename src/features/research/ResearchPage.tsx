import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchIcon } from "@/components/ui/icons";

export function ResearchPage() {
  return (
    <>
      <PageHeader
        title="Research"
        description="Ask a research question. VerityAI plans, gathers evidence and writes a cited report."
      />
      <EmptyState
        icon={<SearchIcon />}
        title="Start your first research run"
        description="You'll type a question here and watch the agent work through each stage live: planning, searching, reading, analyzing and writing."
        phase="Phase 4"
      />
    </>
  );
}
