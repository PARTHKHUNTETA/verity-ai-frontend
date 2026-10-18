import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { BarList } from "@/components/charts/BarList";
import { ChartCard, DataTable } from "@/components/charts/ChartCard";
import { StatTile } from "@/components/charts/StatTile";
import { ms, usd } from "@/components/charts/format";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/auth-context";
import { errorMessage } from "@/services/api-client";
import { evalsApi } from "@/services/evals-api";
import type { EvalCaseCategory, EvalResult, EvalRunDetail } from "@/types/api";
import { CategoryBadge, EvalStatusBadge, PassFail } from "./badges";
import { CATEGORY_LABELS, isLive, pct } from "./format";

const METRICS: Array<{ key: string; label: string }> = [
  { key: "claimSupport", label: "Claim support" },
  { key: "citationAccuracy", label: "Citation accuracy" },
  { key: "citationValidity", label: "Citation validity" },
  { key: "sourceReliability", label: "Source reliability" },
  { key: "coverage", label: "Coverage" },
  { key: "taskCompletion", label: "Task completion" },
  { key: "sourceRecall", label: "Source recall" },
  { key: "requiredPoints", label: "Required points" },
];

/** One eval run: progress while it runs, then its scorecard and every case's verdict. */
export function EvalRunPage() {
  const { evalRunId } = useParams<{ evalRunId: string }>();
  const { can } = useAuth();
  const run = useQuery({
    queryKey: ["evals", "run", evalRunId],
    queryFn: () => evalsApi.getRun(evalRunId!),
    refetchInterval: (q) => (q.state.data && isLive(q.state.data.status) ? 2500 : false),
  });
  const cancel = useMutation({
    mutationFn: () => evalsApi.cancelRun(evalRunId!),
    onSuccess: () => void run.refetch(),
  });

  if (run.isPending) return <FullPageSpinner />;
  if (run.isError) return <Alert>{errorMessage(run.error)}</Alert>;
  const r = run.data;
  const live = isLive(r.status);

  return (
    <div className="space-y-6">
      <Link
        to={r.dataset ? `/evaluations/datasets/${r.dataset.id}` : "/evaluations"}
        className="text-ink-muted hover:text-ink text-sm"
      >
        ← {r.dataset ? r.dataset.name : "Evaluations"}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-ink text-xl font-semibold">{r.name}</h1>
          <div className="text-ink-muted mt-2 flex flex-wrap items-center gap-3 text-sm">
            <EvalStatusBadge status={r.status} />
            <span>
              {r.progress.done} of {r.progress.total} cases
            </span>
          </div>
        </div>
        {live && can("eval:manage") && (
          <Button variant="secondary" loading={cancel.isPending} onClick={() => cancel.mutate()}>
            Cancel
          </Button>
        )}
      </div>
      {cancel.isError && <Alert>{errorMessage(cancel.error)}</Alert>}
      {r.error && <Alert>{r.error}</Alert>}

      {live && <Progress run={r} />}
      <ConfigCard run={r} />
      {r.summary && <SummarySection run={r} />}
      {r.results.length > 0 && <ResultsCard results={r.results} />}
    </div>
  );
}

function Progress({ run }: { run: EvalRunDetail }) {
  const share = run.progress.total ? run.progress.done / run.progress.total : 0;
  return (
    <Card className="p-5">
      <div
        role="progressbar"
        aria-label="Cases done"
        aria-valuemin={0}
        aria-valuemax={run.progress.total}
        aria-valuenow={run.progress.done}
        className="bg-viz-grid h-2 rounded-full"
      >
        <div
          className="bg-viz-1 h-full rounded-full transition-all"
          style={{ width: `${share * 100}%` }}
        />
      </div>
      <p className="text-ink-muted mt-2 text-xs">
        {run.status === "queued" ? (
          "Waiting for a worker…"
        ) : run.currentResearchRunId ? (
          <>
            Working on case {run.progress.done + 1}.{" "}
            <Link to={`/research/runs/${run.currentResearchRunId}`} className="underline">
              Watch it live
            </Link>
          </>
        ) : (
          "Scoring…"
        )}
      </p>
    </Card>
  );
}

function ConfigCard({ run }: { run: EvalRunDetail }) {
  const c = run.config;
  const items: Array<[string, string]> = [
    ["Model", c.model],
    ["Pipeline", c.pipelineVersion],
    ["Policy version", c.policyVersion === null ? "—" : `v${c.policyVersion}`],
    ["Top K", String(c.topK)],
    ["Revision loop", c.revise ? "on" : "off"],
    ["Web & academic search", c.discovery ? "on" : "off"],
  ];
  return (
    <details className="border-line bg-surface rounded-xl border shadow-sm">
      <summary className="text-ink cursor-pointer px-5 py-3 text-sm font-semibold">
        Configuration snapshot
      </summary>
      <dl className="border-line grid grid-cols-2 gap-x-6 gap-y-2 border-t px-5 py-4 text-xs sm:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-ink-muted">{label}</dt>
            <dd className="text-ink font-medium">{value}</dd>
          </div>
        ))}
        <div className="col-span-2 sm:col-span-3">
          <dt className="text-ink-muted">Prompts</dt>
          <dd className="text-ink font-mono">
            {Object.entries(c.promptVersions)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · ")}
          </dd>
        </div>
      </dl>
    </details>
  );
}

function SummarySection({ run }: { run: EvalRunDetail }) {
  const s = run.summary!;
  const metrics = METRICS.filter((m) => s.means[m.key] !== null);
  const categories = Object.entries(s.byCategory) as Array<
    [EvalCaseCategory, { cases: number; passed: number }]
  >;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Pass rate"
          value={pct(s.passRate)}
          sub={`${s.passed} of ${s.cases} cases`}
        />
        <StatTile
          label="Red-team cases passed"
          value={
            s.byCategory.red_team
              ? `${s.byCategory.red_team.passed} / ${s.byCategory.red_team.cases}`
              : "—"
          }
          sub={
            s.byCategory.red_team ? "resisted prompt injection" : "no red-team cases in this run"
          }
        />
        <StatTile
          label="Latency p50 / p95"
          value={ms(s.latencyMs.p50)}
          sub={`p95 ${ms(s.latencyMs.p95)}`}
        />
        <StatTile
          label="Total cost"
          value={usd(s.totalCostUsd)}
          sub={`${s.completed} runs completed`}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Mean scores"
          description="Averaged over the cases where each metric could be measured."
          table={
            <DataTable
              columns={["Metric", "Mean"]}
              rows={metrics.map((m) => [m.label, pct(s.means[m.key])])}
            />
          }
        >
          <BarList
            items={metrics.map((m) => ({ label: m.label, value: s.means[m.key]! }))}
            format={(v) => pct(v)}
          />
        </ChartCard>
        <ChartCard
          title="Pass rate by category"
          description="Normal questions, edge cases, questions without an answer, and attacks."
          table={
            <DataTable
              columns={["Category", "Passed", "Cases", "Pass rate"]}
              rows={categories.map(([c, v]) => [
                CATEGORY_LABELS[c] ?? c,
                v.passed,
                v.cases,
                pct(v.passed / v.cases),
              ])}
            />
          }
        >
          <BarList
            items={categories.map(([c, v]) => ({
              label: CATEGORY_LABELS[c] ?? c,
              value: v.passed / v.cases,
              detail: `${v.passed} of ${v.cases} passed`,
            }))}
            format={(v) => pct(v)}
          />
        </ChartCard>
      </div>
    </>
  );
}

/** Quality misses recorded on red-team cases (they don't fail the case). */
function warningsOf(r: EvalResult): string[] {
  const w = r.details.warnings;
  return Array.isArray(w) ? w.filter((x): x is string => typeof x === "string") : [];
}

function ResultsCard({ results }: { results: EvalResult[] }) {
  const [onlyFailed, setOnlyFailed] = useState(false);
  const shown = onlyFailed ? results.filter((r) => !r.passed) : results;
  return (
    <Card>
      <div className="border-line flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
        <h2 className="text-ink text-sm font-semibold">Cases</h2>
        <label className="text-ink-muted flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={onlyFailed}
            onChange={(e) => setOnlyFailed(e.target.checked)}
          />
          Only failed ({results.filter((r) => !r.passed).length})
        </label>
      </div>
      <ul className="divide-line divide-y">
        {shown.map((r) => (
          <li key={r.id} className="px-5 py-3">
            <div className="flex items-start gap-3">
              <span className="text-ink-subtle w-6 shrink-0 pt-0.5 text-xs tabular-nums">
                {r.position}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-ink text-sm">{r.question}</p>
                <div className="text-ink-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <CategoryBadge category={r.category} />
                  <span>claim support {pct(r.scores.claimSupport)}</span>
                  {r.scores.requiredPoints !== null && (
                    <span>points {pct(r.scores.requiredPoints)}</span>
                  )}
                  {r.scores.sourceRecall !== null && (
                    <span>source recall {pct(r.scores.sourceRecall)}</span>
                  )}
                  {r.researchRunId && (
                    <Link
                      to={`/research/runs/${r.researchRunId}`}
                      className="text-brand-600 hover:underline"
                    >
                      Open run →
                    </Link>
                  )}
                </div>
                {r.failures.length > 0 && (
                  <ul className={cn("mt-1.5 space-y-0.5 text-xs text-red-800")}>
                    {r.failures.map((f) => (
                      <li key={f}>
                        <span aria-hidden="true">▲ </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                {warningsOf(r).length > 0 && (
                  <ul className="text-ink-muted mt-1.5 space-y-0.5 text-xs">
                    {warningsOf(r).map((w) => (
                      <li key={w}>
                        <span className="font-medium">
                          Quality note (doesn't fail a red-team case):{" "}
                        </span>
                        {w}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <PassFail passed={r.passed} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
