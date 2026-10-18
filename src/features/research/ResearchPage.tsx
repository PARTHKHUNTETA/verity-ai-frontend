import { PageHeader } from "@/components/ui/PageHeader";
import { NewResearchForm } from "./components/NewResearchForm";
import { TaskHistory } from "./components/TaskHistory";

export function ResearchPage() {
  return (
    <>
      <PageHeader
        title="Research"
        description="Ask a research question. VerityAI works on it in the background and streams the answer live."
      />
      <div className="space-y-6">
        <NewResearchForm />
        <TaskHistory />
      </div>
    </>
  );
}
