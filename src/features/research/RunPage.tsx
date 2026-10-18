import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useAuth, useMe } from "@/features/auth/auth-context";
import { errorMessage } from "@/services/api-client";
import { researchApi } from "@/services/research-api";
import { AnswerView } from "./components/AnswerView";
import { RunStatusBadge } from "./components/RunStatusBadge";
import { AnalysisCard } from "./components/AnalysisCard";
import { DiscoveredSources } from "./components/DiscoveredSources";
import { PlanCard } from "./components/PlanCard";
import { PolicyDecisionsCard } from "./components/PolicyDecisionsCard";
import { StageTimeline } from "./components/StageTimeline";
import { SourcesList } from "./components/SourcesList";
import { formatCost, formatDuration, isActive } from "./format";
import { useRunStream } from "./hooks/useRunStream";

export function RunPage() {
  const { runId } = useParams<{ runId: string }>();
  return runId ? <RunView key={runId} runId={runId} /> : null;
}

function RunView({ runId }: { runId: string }) {
  const me = useMe();
  const { can } = useAuth();
  const navigate = useNavigate();
  const { detail, content, error } = useRunStream(runId);

  const cancel = useMutation({ mutationFn: () => researchApi.cancelRun(runId) });
  const rerun = useMutation({
    mutationFn: () => researchApi.rerun(detail!.task.id),
    onSuccess: (run) => navigate(`/research/runs/${run.id}`),
  });

  if (!detail) {
    return error ? <Alert>{error}</Alert> : <FullPageSpinner />;
  }

  const { run, task } = detail;
  const active = isActive(run.status);
  const canCancel = active && (run.startedBy === me.user.id || can("run:manage"));

  return (
    <div className="space-y-6">
      <Link to="/research" className="text-ink-muted hover:text-ink text-sm">
        ← All research
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-ink text-xl font-semibold tracking-tight">{task.question}</h1>
          <div className="text-ink-muted mt-2 flex flex-wrap items-center gap-3 text-sm">
            <RunStatusBadge status={run.status} />
            {run.stage && active && <span>{STAGE_LABELS[run.stage]}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {canCancel && (
            <Button variant="secondary" loading={cancel.isPending} onClick={() => cancel.mutate()}>
              Cancel
            </Button>
          )}
          {!active && can("run:create") && (
            <Button variant="secondary" loading={rerun.isPending} onClick={() => rerun.mutate()}>
              Run again
            </Button>
          )}
        </div>
      </div>

      <StageTimeline detail={detail} />

      {run.status === "awaiting_approval" && (
        <Alert tone="info">
          <span className="font-medium">Paused, waiting for approval: </span>
          {detail.approvals
            .filter((a) => a.status === "pending")
            .map((a) => a.summary)
            .join("; ") || "a policy decision"}
          .{" "}
          {can("approval:decide") ? (
            <Link to="/approvals" className="font-medium underline">
              Review it
            </Link>
          ) : (
            "An owner or admin needs to review it."
          )}
        </Alert>
      )}
      {error && <Alert tone="info">{error}</Alert>}
      {cancel.isError && <Alert>{errorMessage(cancel.error)}</Alert>}
      {run.status === "failed" && (
        <Alert>
          {run.errorMessage ?? "The run failed."}
          {run.errorCode && <span className="ml-1 text-xs opacity-70">({run.errorCode})</span>}
        </Alert>
      )}

      <Card className="p-5 sm:p-6">
        {content ? (
          <AnswerView
            content={content}
            streaming={run.status === "running"}
            citations={detail.citations}
          />
        ) : (
          <p className="text-ink-muted text-sm">
            {run.status === "queued"
              ? "Waiting for a worker to pick up this run…"
              : active
                ? (STAGE_LABELS[run.stage ?? "synthesizing"] ?? "Working…")
                : "No answer was produced."}
          </p>
        )}
      </Card>

      <PlanCard subQuestions={detail.subQuestions} />
      <AnalysisCard toolCalls={detail.toolCalls} />
      <PolicyDecisionsCard decisions={detail.decisions} />
      <SourcesList citations={detail.citations} />
      <DiscoveredSources sources={detail.discovered} />

      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <Meta label="Model" value={run.model} />
        <Meta
          label="Tokens (in / out)"
          value={run.status === "completed" ? `${run.tokensInput} / ${run.tokensOutput}` : "—"}
        />
        <Meta label="Cost" value={run.status === "completed" ? formatCost(run.costUsd) : "—"} />
        <Meta label="Duration" value={formatDuration(run.durationMs)} />
      </dl>
    </div>
  );
}

const STAGE_LABELS: Record<string, string> = {
  planning: "Planning the research…",
  discovering: "Searching the web and academic papers…",
  acquiring: "Reading the most promising sources…",
  retrieving: "Finding the relevant passages…",
  extracting: "Extracting evidence…",
  analyzing: "Analyzing…",
  synthesizing: "Writing the answer…",
  evaluating: "Checking the answer…",
};

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line bg-surface rounded-lg border px-4 py-3">
      <dt className="text-ink-muted text-xs">{label}</dt>
      <dd className="text-ink mt-0.5 truncate font-medium" title={value}>
        {value}
      </dd>
    </div>
  );
}
