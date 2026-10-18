import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { errorMessage } from "@/services/api-client";
import { reportsApi } from "@/services/reports-api";
import { AnswerView } from "@/features/research/components/AnswerView";
import { ExportButtons } from "./ExportButtons";

/** One report version: read it, switch to another version, download it. */
export function ReportPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const report = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => reportsApi.get(reportId!),
  });

  if (report.isPending) return <FullPageSpinner />;
  if (report.isError) return <Alert>{errorMessage(report.error)}</Alert>;
  const r = report.data;
  const superseded = r.status === "superseded";

  return (
    <div className="space-y-6">
      <Link to="/reports" className="text-ink-muted hover:text-ink text-sm">
        ← All reports
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-ink-muted text-sm">{r.question}</p>
          <p className="text-ink-subtle mt-1 text-xs">
            {r.model}
            {r.completedAt && ` · ${new Date(r.completedAt).toLocaleString()}`} ·{" "}
            <Link to={`/research/runs/${r.runId}`} className="underline">
              run, scorecard and trace
            </Link>
          </p>
        </div>
        <ExportButtons reportId={r.id} />
      </div>

      {r.versions.length > 1 && (
        <div
          role="group"
          aria-label="Report version"
          className="border-line inline-flex rounded-lg border p-0.5 text-xs"
        >
          {r.versions.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={v.id === r.id}
              onClick={() => navigate(`/reports/${v.id}`)}
              className={cn(
                "rounded-md px-3 py-1",
                v.id === r.id ? "bg-canvas text-ink font-medium" : "text-ink-muted hover:text-ink",
              )}
            >
              Version {v.version}
              {v.status === "superseded"
                ? " (superseded)"
                : v.id === r.scoredReportId
                  ? " (shown)"
                  : ""}
            </button>
          ))}
        </div>
      )}
      {superseded && (
        <Alert tone="info">
          This version was replaced after fact-checking. The citations still work, but some claims
          here were flagged as unsupported.
        </Alert>
      )}

      <Card className="p-5 sm:p-6">
        <AnswerView content={r.contentMd} streaming={false} citations={r.citations} />
      </Card>
    </div>
  );
}
