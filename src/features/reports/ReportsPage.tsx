import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { Link } from "react-router";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessage } from "@/services/api-client";
import { reportsApi } from "@/services/reports-api";
import { formatRelativeTime } from "@/features/research/format";

/** Every finished report in the organization, searchable, newest first. */
export function ReportsPage() {
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim());
  const reports = useQuery({
    queryKey: ["reports", query],
    queryFn: () => reportsApi.list(query || undefined),
    placeholderData: (previous) => previous,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Cited research reports from your runs. Open one to read it, switch versions, or download it as PDF or Markdown."
      />
      <div className="max-w-md">
        <Input
          label="Search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Question or title"
        />
      </div>
      {reports.isError && <Alert>{errorMessage(reports.error)}</Alert>}
      {reports.isPending ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : reports.data?.length === 0 ? (
        <Card className="text-ink-muted p-6 text-sm">
          {query
            ? "No reports match your search."
            : "No reports yet. Finished research runs appear here."}
        </Card>
      ) : (
        <Card>
          <ul className="divide-line divide-y">
            {reports.data?.map((r) => (
              <li key={r.id}>
                <Link to={`/reports/${r.id}`} className="hover:bg-canvas block px-5 py-3.5">
                  <p className="text-ink text-sm font-medium">{r.title ?? r.question}</p>
                  {r.title && (
                    <p className="text-ink-muted mt-0.5 line-clamp-1 text-xs">{r.question}</p>
                  )}
                  <p className="text-ink-subtle mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {r.completedAt && <span>{formatRelativeTime(r.completedAt)}</span>}
                    <span>{r.model}</span>
                    {r.passed !== null && (
                      <span className="text-ink-muted inline-flex items-center gap-1">
                        <span
                          aria-hidden="true"
                          className={r.passed ? "text-status-good" : "text-status-critical"}
                        >
                          {r.passed ? "✓" : "▲"}
                        </span>
                        {r.passed ? "passed every check" : "below target on some checks"}
                      </span>
                    )}
                    {r.claimSupportRate !== null && (
                      <span>{Math.round(r.claimSupportRate * 100)}% of claims supported</span>
                    )}
                    {r.revised && <span>revised after fact-check</span>}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
