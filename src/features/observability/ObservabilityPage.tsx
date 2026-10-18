import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BarList } from "@/components/charts/BarList";
import { ChartCard, DataTable } from "@/components/charts/ChartCard";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { compact, ms, usd } from "@/components/charts/format";
import { StatTile } from "@/components/charts/StatTile";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/components/ui/cn";
import { PageHeader } from "@/components/ui/PageHeader";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { errorMessage } from "@/services/api-client";
import { observabilityApi } from "@/services/observability-api";

const RANGES = [7, 30, 90] as const;

/** Org-wide health of the agent: speed, cost, failures, tool errors and policy denials. */
export function ObservabilityPage() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(7);
  const metrics = useQuery({
    queryKey: ["metrics", days],
    queryFn: () => observabilityApi.metrics(days),
    placeholderData: (previous) => previous, // keep the frame while a new range loads
  });

  return (
    <>
      <PageHeader
        title="Observability"
        description="How fast, reliable and expensive your research runs are."
      />
      {/* One filter row above everything it scopes. */}
      <div
        role="radiogroup"
        aria-label="Time range"
        className="border-line bg-surface mb-6 flex w-fit gap-1 rounded-lg border p-1 text-sm"
      >
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={days === r}
            onClick={() => setDays(r)}
            className={cn(
              "rounded-md px-3 py-1",
              days === r ? "bg-canvas text-ink font-medium" : "text-ink-muted hover:text-ink",
            )}
          >
            Last {r} days
          </button>
        ))}
      </div>

      {metrics.isPending && <FullPageSpinner />}
      {metrics.isError && <Alert>{errorMessage(metrics.error)}</Alert>}
      {metrics.data && (
        <div className={cn("space-y-6", metrics.isFetching && "opacity-70 transition-opacity")}>
          <Overview data={metrics.data} />
        </div>
      )}
    </>
  );
}

function Overview({
  data,
}: {
  data: NonNullable<Awaited<ReturnType<typeof observabilityApi.metrics>>>;
}) {
  const { runs } = data;
  const successRate = runs.total ? Math.round((100 * runs.completed) / runs.total) : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label="Runs"
          value={compact(runs.total)}
          sub={`${runs.failed} failed · ${runs.awaitingApproval} waiting`}
        />
        <StatTile
          label="Completed"
          value={successRate === null ? "—" : `${successRate}%`}
          sub={`${runs.completed} of ${runs.total}`}
        />
        <StatTile label="Median run time" value={ms(runs.p50Ms)} sub="p50, completed runs" />
        <StatTile label="Slow runs" value={ms(runs.p95Ms)} sub="p95, completed runs" />
        <StatTile
          label="Total cost"
          value={usd(runs.totalCostUsd)}
          sub={`avg ${usd(runs.avgCostUsd)} per run`}
        />
        <StatTile label="Tokens" value={compact(runs.totalTokens)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Runs per day"
          table={
            <DataTable
              columns={["Day", "Runs", "Failed"]}
              rows={data.daily.map((d) => [d.day, d.runs, d.failed])}
            />
          }
        >
          <ColumnChart
            points={data.daily.map((d) => ({
              label: d.day,
              value: d.runs,
              detail: `${d.failed} failed`,
            }))}
            format={(v) => compact(v)}
          />
        </ChartCard>
        {/* A separate chart, not a second axis: cost and run counts don't share a scale. */}
        <ChartCard
          title="Cost per day"
          table={
            <DataTable
              columns={["Day", "Cost"]}
              rows={data.daily.map((d) => [d.day, usd(d.costUsd)])}
            />
          }
        >
          <ColumnChart
            points={data.daily.map((d) => ({ label: d.day, value: d.costUsd }))}
            format={(v) => usd(v)}
          />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Slowest stages"
          description="p95 duration"
          table={
            <DataTable
              columns={["Stage", "Runs", "p50", "p95"]}
              rows={data.stages.map((s) => [s.name, s.calls, ms(s.p50Ms), ms(s.p95Ms)])}
            />
          }
        >
          <BarList
            items={data.stages.map((s) => ({
              label: s.name,
              value: s.p95Ms ?? 0,
              detail: `p50 ${ms(s.p50Ms)}`,
            }))}
            format={ms}
          />
        </ChartCard>
        <ChartCard
          title="Failures"
          description="Failed runs by error code"
          table={
            <DataTable
              columns={["Error code", "Runs"]}
              rows={data.failures.map((f) => [f.code, f.count])}
            />
          }
        >
          <BarList
            items={data.failures.map((f) => ({ label: f.code, value: f.count }))}
            format={(v) => String(v)}
          />
        </ChartCard>
        <ChartCard
          title="Policy denials"
          description="Tool calls denied or sent for approval, by rule"
          table={
            <DataTable
              columns={["Rule", "Decision", "Calls"]}
              rows={data.denials.map((d) => [d.rule, d.decision, d.count])}
            />
          }
        >
          <BarList
            items={data.denials.map((d) => ({
              label: d.rule,
              value: d.count,
              detail: d.decision === "deny" ? "denied" : "needed approval",
            }))}
            format={(v) => String(v)}
          />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="LLM calls"
          description="Latency per call type"
          table={
            <DataTable
              columns={["Call", "Calls", "p50", "p95", "Errors", "Cost"]}
              rows={data.llm.map((l) => [
                l.name,
                l.calls,
                ms(l.p50Ms),
                ms(l.p95Ms),
                `${Math.round(l.errorRate * 100)}%`,
                usd(l.costUsd),
              ])}
            />
          }
        >
          <BarList
            items={data.llm.map((l) => ({
              label: l.name,
              value: l.p95Ms ?? 0,
              detail: `${l.calls} calls · p50 ${ms(l.p50Ms)}`,
            }))}
            format={ms}
          />
        </ChartCard>
        <ChartCard
          title="Tools"
          description="Calls per tool"
          table={
            <DataTable
              columns={["Tool", "Calls", "Failed", "Denied", "Avg", "Error rate"]}
              rows={data.tools.map((t) => [
                t.tool,
                t.calls,
                t.failed,
                t.denied,
                ms(t.avgMs),
                `${Math.round(t.errorRate * 100)}%`,
              ])}
            />
          }
        >
          <BarList
            items={data.tools.map((t) => ({
              label: t.tool,
              value: t.calls,
              detail: `${t.failed} failed · ${t.denied} denied · avg ${ms(t.avgMs)}`,
            }))}
            format={(v) => compact(v)}
          />
        </ChartCard>
      </div>
    </>
  );
}
