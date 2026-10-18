import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessage } from "@/services/api-client";
import { researchApi } from "@/services/research-api";
import { formatRelativeTime, isActive } from "../format";
import { RunStatusBadge } from "./RunStatusBadge";

export function TaskHistory() {
  const tasks = useQuery({
    queryKey: ["research", "tasks"],
    queryFn: researchApi.listTasks,
    // While something is still running, refresh the list now and then.
    refetchInterval: (query) =>
      query.state.data?.some((t) => t.latestRun && isActive(t.latestRun.status)) ? 5000 : false,
  });

  return (
    <Card>
      <h2 className="border-line text-ink border-b px-5 py-4 text-sm font-semibold">
        Recent research
      </h2>
      {tasks.isPending && (
        <div className="text-brand-600 flex justify-center py-10">
          <Spinner />
        </div>
      )}
      {tasks.isError && (
        <div className="p-5">
          <Alert>{errorMessage(tasks.error)}</Alert>
        </div>
      )}
      {tasks.isSuccess && tasks.data.length === 0 && (
        <p className="text-ink-muted px-5 py-10 text-center text-sm">
          No research yet. Ask your first question above.
        </p>
      )}
      {tasks.isSuccess && tasks.data.length > 0 && (
        <ul className="divide-line divide-y">
          {tasks.data.map((task) => (
            <li key={task.id}>
              {task.latestRun ? (
                <Link
                  to={`/research/runs/${task.latestRun.id}`}
                  className="hover:bg-canvas flex items-center justify-between gap-4 px-5 py-3"
                >
                  <span className="min-w-0">
                    <span className="text-ink block truncate text-sm font-medium">
                      {task.question}
                    </span>
                    <span className="text-ink-muted text-xs">
                      {formatRelativeTime(task.createdAt)}
                    </span>
                  </span>
                  <RunStatusBadge status={task.latestRun.status} />
                </Link>
              ) : (
                <span className="text-ink-muted block px-5 py-3 text-sm">{task.question}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
