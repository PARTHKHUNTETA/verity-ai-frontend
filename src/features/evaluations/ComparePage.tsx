import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";
import { ChartCard, DataTable, Legend } from "@/components/charts/ChartCard";
import { GroupedBars } from "@/components/charts/GroupedBars";
import { ms, usd } from "@/components/charts/format";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { errorMessage } from "@/services/api-client";
import { evalsApi } from "@/services/evals-api";
import type { EvalConfig, EvalRun, MetricComparison } from "@/types/api";
import { CategoryBadge, PassFail } from "./badges";
import { pct } from "./format";

const COLORS = { a: "var(--color-viz-1)", b: "var(--color-viz-2)" };

/** Settings that differ between the two runs: the "what changed" of the comparison. */
function configDiff(a: EvalConfig, b: EvalConfig): Array<[string, string, string]> {
  const rows: Array<[string, string, string]> = [
    ["Model", a.model, b.model],
    ["Pipeline", a.pipelineVersion, b.pipelineVersion],
    ["Top K", String(a.topK), String(b.topK)],
    ["Revision loop", a.revise ? "on" : "off", b.revise ? "on" : "off"],
    ["Web & academic search", a.discovery ? "on" : "off", b.discovery ? "on" : "off"],
    ["Policy version", String(a.policyVersion ?? "—"), String(b.policyVersion ?? "—")],
    ["Cases", String(a.limit ?? "all"), String(b.limit ?? "all")],
  ];
  for (const key of new Set([...Object.keys(a.promptVersions), ...Object.keys(b.promptVersions)])) {
    rows.push([`Prompt: ${key}`, a.promptVersions[key] ?? "—", b.promptVersions[key] ?? "—"]);
  }
  return rows.filter(([, x, y]) => x !== y);
}

const isRate = (m: MetricComparison) => m.key !== "latencyP95" && m.key !== "totalCostUsd";

function formatMetric(m: MetricComparison, v: number | null) {
  if (v === null) return "—";
  if (m.key === "latencyP95") return ms(v);
  if (m.key === "totalCostUsd") return usd(v);
  return pct(v);
}

/** Two eval runs on the same dataset, side by side: which config is better on each metric? */
export function ComparePage() {
  const [params] = useSearchParams();
  const a = params.get("a");
  const b = params.get("b");
  const comparison = useQuery({
    queryKey: ["evals", "compare", a, b],
    queryFn: () => evalsApi.compare(a!, b!),
    enabled: Boolean(a && b),
  });

  if (!a || !b) return <Alert>Pick two eval runs to compare on the Evaluations page.</Alert>;
  if (comparison.isPending) return <FullPageSpinner />;
  if (comparison.isError) return <Alert>{errorMessage(comparison.error)}</Alert>;
  const c = comparison.data;
  const rates = c.metrics.filter(isRate);
  const diff = configDiff(c.a.config, c.b.config);
  const changed = c.cases.filter((x) => x.change !== "same");
  const wins = {
    a: c.metrics.filter((m) => m.better === "a").length,
    b: c.metrics.filter((m) => m.better === "b").length,
  };

  return (
    <div className="space-y-6">
      <Link to="/evaluations" className="text-ink-muted hover:text-ink text-sm">
        ← Evaluations
      </Link>
      <div>
        <h1 className="text-ink text-xl font-semibold">Compare eval runs</h1>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <RunHeader run={c.a} tag="A" color={COLORS.a} wins={wins.a} />
          <RunHeader run={c.b} tag="B" color={COLORS.b} wins={wins.b} />
        </div>
      </div>

      <Card>
        <h2 className="border-line text-ink border-b px-5 py-3 text-sm font-semibold">
          What changed
        </h2>
        {diff.length === 0 ? (
          <p className="text-ink-muted px-5 py-3 text-sm">
            Same configuration: differences come from model randomness or changed documents.
          </p>
        ) : (
          <div className="px-5 py-3">
            <DataTable columns={["Setting", "A", "B"]} rows={diff} />
          </div>
        )}
      </Card>

      <ChartCard
        title="Scores, A vs B"
        description="Higher is better. Every rate shares one 0–100% axis."
        legend={
          <Legend
            items={[
              { label: `A · ${c.a.name}`, color: COLORS.a },
              { label: `B · ${c.b.name}`, color: COLORS.b },
            ]}
          />
        }
        table={
          <DataTable
            columns={["Metric", "A", "B", "Change", "Better"]}
            rows={c.metrics.map((m) => [
              m.label,
              formatMetric(m, m.a),
              formatMetric(m, m.b),
              m.delta === null
                ? "—"
                : `${m.delta > 0 ? "+" : ""}${isRate(m) ? `${Math.round(m.delta * 100)} pts` : formatMetric(m, m.delta)}`,
              m.better === null ? "—" : m.better === "same" ? "same" : m.better.toUpperCase(),
            ])}
          />
        }
      >
        <GroupedBars
          rows={rates.map((m) => ({ label: m.label, values: [m.a, m.b] }))}
          series={[
            { label: "A", color: COLORS.a },
            { label: "B", color: COLORS.b },
          ]}
          format={(v) => pct(v)}
        />
      </ChartCard>

      <Card>
        <h2 className="border-line text-ink border-b px-5 py-3 text-sm font-semibold">
          Metric by metric
        </h2>
        <ul className="divide-line divide-y">
          {c.metrics.map((m) => (
            <li key={m.key} className="flex items-center justify-between gap-3 px-5 py-2 text-sm">
              <span className="text-ink">{m.label}</span>
              <span className="text-ink-muted flex items-center gap-3 text-xs tabular-nums">
                {formatMetric(m, m.a)} → {formatMetric(m, m.b)}
                <Verdict better={m.better} />
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="border-line text-ink border-b px-5 py-3 text-sm font-semibold">
          Cases that changed ({changed.length})
        </h2>
        {changed.length === 0 ? (
          <p className="text-ink-muted px-5 py-3 text-sm">
            Every case has the same verdict in both runs.
          </p>
        ) : (
          <ul className="divide-line divide-y">
            {changed.map((x) => (
              <li key={x.caseId} className="flex items-start gap-3 px-5 py-3">
                <span className="text-ink-subtle w-6 shrink-0 pt-0.5 text-xs tabular-nums">
                  {x.position}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-sm">{x.question}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <CategoryBadge category={x.category} />
                    <span className="text-ink-muted text-xs">
                      A <PassFail passed={x.a} /> → B <PassFail passed={x.b} />
                    </span>
                  </div>
                </div>
                <span className="text-ink inline-flex shrink-0 items-center gap-1 text-xs font-medium">
                  <span
                    aria-hidden="true"
                    className={x.change === "fixed" ? "text-status-good" : "text-status-critical"}
                  >
                    {x.change === "fixed" ? "▲" : "▼"}
                  </span>
                  {x.change === "fixed" ? "Fixed in B" : "Regressed in B"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function RunHeader({
  run,
  tag,
  color,
  wins,
}: {
  run: EvalRun;
  tag: string;
  color: string;
  wins: number;
}) {
  return (
    <Link
      to={`/evaluations/runs/${run.id}`}
      className="border-line bg-surface hover:border-brand-500 block rounded-xl border p-4 shadow-sm"
    >
      <p className="text-ink flex items-center gap-2 text-sm font-semibold">
        <span
          className="inline-block size-2.5 rounded-sm"
          style={{ background: color }}
          aria-hidden="true"
        />
        {tag} · {run.name}
      </p>
      <p className="text-ink-muted mt-1 text-xs">
        pass rate {pct(run.summary?.passRate)} · better on {wins} metric{wins === 1 ? "" : "s"}
      </p>
    </Link>
  );
}

function Verdict({ better }: { better: MetricComparison["better"] }) {
  if (better === null) return <span className="w-16 text-right">—</span>;
  if (better === "same") return <span className="w-16 text-right">same</span>;
  return (
    <span className="text-ink w-16 text-right font-medium">{better.toUpperCase()} better</span>
  );
}
