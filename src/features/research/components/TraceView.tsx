import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChartCard, DataTable, Legend } from "@/components/charts/ChartCard";
import { compact, ms, usd } from "@/components/charts/format";
import { StatTile } from "@/components/charts/StatTile";
import { useChartTooltip } from "@/components/charts/Tooltip";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessage } from "@/services/api-client";
import { observabilityApi } from "@/services/observability-api";
import type { TraceSpan } from "@/types/api";

/**
 * The run's trace: where the time went (waterfall) and what it cost. Colors carry the span's
 * category, and every row is also text-labeled (color never carries identity alone):
 * stage = slot 1, LLM call = slot 2, tool call = slot 3, everything else = recessive gray.
 */
const CATEGORIES = [
  { key: "stage", label: "Stage", color: "var(--color-viz-1)" },
  { key: "llm", label: "LLM call", color: "var(--color-viz-2)" },
  { key: "tool", label: "Tool call", color: "var(--color-viz-3)" },
  { key: "other", label: "Policy, fetch, parse, retrieval", color: "var(--color-viz-muted)" },
] as const;

function categoryOf(name: string) {
  if (name === "run" || name.startsWith("stage.")) return CATEGORIES[0];
  if (name.startsWith("llm.")) return CATEGORIES[1];
  if (name.startsWith("tool.")) return CATEGORIES[2];
  return CATEGORIES[3];
}

type Row = { span: TraceSpan; depth: number; offset: number; duration: number };

/** Depth-first order (children right after their parent), with times relative to the start. */
function toRows(spans: TraceSpan[]): { rows: Row[]; total: number } {
  if (spans.length === 0) return { rows: [], total: 0 };
  const t0 = Math.min(...spans.map((s) => Date.parse(s.startTime)));
  const end = Math.max(...spans.map((s) => Date.parse(s.endTime ?? s.startTime)));
  const children = new Map<string | null, TraceSpan[]>();
  const ids = new Set(spans.map((s) => s.spanId));
  for (const s of spans) {
    const parent = s.parentSpanId && ids.has(s.parentSpanId) ? s.parentSpanId : null;
    children.set(parent, [...(children.get(parent) ?? []), s]);
  }
  const rows: Row[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const s of (children.get(parent) ?? []).sort(
      (a, b) => Date.parse(a.startTime) - Date.parse(b.startTime),
    )) {
      rows.push({
        span: s,
        depth,
        offset: Date.parse(s.startTime) - t0,
        duration: s.durationMs ?? 0,
      });
      walk(s.spanId, depth + 1);
    }
  };
  walk(null, 0);
  return { rows, total: Math.max(end - t0, 1) };
}

function detailOf(span: TraceSpan): string | null {
  const a = span.attributes;
  const value = a.model ?? a.target ?? a.url ?? a.query ?? a.decision ?? null;
  return value == null ? null : String(value);
}

export function TraceView({ runId, refreshKey }: { runId: string; refreshKey: string }) {
  const trace = useQuery({
    queryKey: ["trace", runId, refreshKey],
    queryFn: () => observabilityApi.runTrace(runId),
    placeholderData: (previous) => previous, // keep the frame while refetching
  });
  const [selected, setSelected] = useState<string | null>(null);
  const { rows, total } = useMemo(() => toRows(trace.data?.spans ?? []), [trace.data]);

  if (trace.isPending) {
    return (
      <div className="text-brand-600 flex justify-center py-10">
        <Spinner />
      </div>
    );
  }
  if (trace.isError) return <Alert>{errorMessage(trace.error)}</Alert>;
  if (rows.length === 0) {
    return (
      <Card className="text-ink-muted px-6 py-10 text-center text-sm">
        No trace yet: spans appear as soon as the run starts working.
      </Card>
    );
  }

  const { summary } = trace.data;
  const selectedSpan = rows.find((r) => r.span.spanId === selected)?.span ?? null;
  const share = (part: number) =>
    summary.totalMs ? `${Math.round((100 * part) / summary.totalMs)}% of the run` : undefined;

  return (
    <div className={cn("space-y-6", trace.isFetching && "opacity-80")}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile label="Total time" value={ms(summary.totalMs)} />
        <StatTile
          label="LLM calls"
          value={ms(summary.llm.ms)}
          sub={`${summary.llm.calls} calls · ${share(summary.llm.ms) ?? ""}`}
        />
        <StatTile
          label="Tool calls"
          value={ms(summary.tools.ms)}
          sub={`${summary.tools.calls} calls · ${summary.tools.cached} cached`}
        />
        <StatTile label="Cost" value={usd(summary.llm.costUsd)} sub="from LLM spans" />
        <StatTile
          label="Tokens"
          value={compact(summary.llm.tokensInput + summary.llm.tokensOutput)}
          sub={`${compact(summary.llm.tokensInput)} in · ${compact(summary.llm.tokensOutput)} out`}
        />
      </div>

      {summary.errors.length > 0 && (
        <Alert>
          <span aria-hidden="true">⚠ </span>
          {summary.errors.length} span{summary.errors.length === 1 ? "" : "s"} failed:{" "}
          {summary.errors.map((e) => `${e.name}${e.message ? ` (${e.message})` : ""}`).join("; ")}
        </Alert>
      )}

      <StageBreakdown stages={summary.stages} />

      <ChartCard
        title="Waterfall"
        description="Every timed operation, nested under the stage that ran it. Click a bar for its details."
        legend={<Legend items={CATEGORIES.map((c) => ({ label: c.label, color: c.color }))} />}
        table={
          <DataTable
            columns={["Span", "Starts at", "Duration", "Status", "Detail"]}
            rows={rows.map((r) => [
              `${"  ".repeat(r.depth)}${r.span.name}`,
              ms(r.offset),
              ms(r.duration),
              r.span.status,
              detailOf(r.span) ?? "",
            ])}
          />
        }
      >
        <Waterfall rows={rows} total={total} selected={selected} onSelect={setSelected} />
        {selectedSpan && <SpanDetail span={selectedSpan} onClose={() => setSelected(null)} />}
      </ChartCard>

      <Card>
        <h3 className="border-line text-ink border-b px-5 py-3 text-sm font-semibold">
          Slowest operations
        </h3>
        <ol className="divide-line divide-y">
          {summary.slowest.map((s) => (
            <li key={s.spanId}>
              <button
                type="button"
                onClick={() => setSelected(s.spanId)}
                className="hover:bg-canvas flex w-full items-center justify-between gap-4 px-5 py-2.5 text-left"
              >
                <span className="text-ink min-w-0 text-sm">
                  {s.name}
                  {s.detail && <span className="text-ink-muted"> · {s.detail}</span>}
                </span>
                <span className="text-ink shrink-0 text-sm tabular-nums">{ms(s.ms)}</span>
              </button>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Waterfall({
  rows,
  total,
  selected,
  onSelect,
}: {
  rows: Row[];
  total: number;
  selected: string | null;
  onSelect: (spanId: string) => void;
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip();
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div ref={containerRef} className="relative">
      <div className="grid grid-cols-[minmax(0,15rem)_1fr] gap-x-3">
        {/* time axis */}
        <div />
        <div className="relative mb-1 h-4 text-[10px] text-[var(--color-viz-axis)] tabular-nums">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
              style={{ left: `${t * 100}%` }}
            >
              {ms(t * total)}
            </span>
          ))}
        </div>
        {rows.map((row) => {
          const category = categoryOf(row.span.name);
          const failed = row.span.status === "error";
          const content = {
            value: ms(row.duration),
            label: row.span.name,
            detail: [detailOf(row.span), failed ? `failed: ${row.span.errorMessage ?? ""}` : null]
              .filter(Boolean)
              .join(" · "),
          };
          return (
            <div key={row.span.spanId} className="contents">
              <div
                className="flex min-w-0 items-center gap-1 py-0.5 text-xs"
                style={{ paddingLeft: row.depth * 12 }}
              >
                {failed && (
                  <span className="text-[var(--color-status-critical)]" aria-label="failed">
                    ⚠
                  </span>
                )}
                <span
                  className={cn(
                    "truncate",
                    selected === row.span.spanId ? "text-ink font-semibold" : "text-ink-muted",
                  )}
                >
                  {row.span.name}
                </span>
              </div>
              <div className="relative h-6">
                {ticks.map((t) => (
                  <div
                    key={t}
                    className="absolute inset-y-0 border-l border-[var(--color-viz-grid)]"
                    style={{ left: `${t * 100}%` }}
                  />
                ))}
                <button
                  type="button"
                  aria-label={`${row.span.name}: ${ms(row.duration)}${failed ? ", failed" : ""}`}
                  aria-pressed={selected === row.span.spanId}
                  onClick={() => onSelect(row.span.spanId)}
                  onPointerEnter={(e) => show(e.currentTarget, content)}
                  onPointerLeave={hide}
                  onFocus={(e) => show(e.currentTarget, content)}
                  onBlur={hide}
                  // The hit area is the full row height; the visible bar is 12px.
                  className="focus-visible:outline-brand-600 absolute inset-y-0 flex items-center focus-visible:outline-2"
                  style={{
                    left: `${(row.offset / total) * 100}%`,
                    width: `max(${(row.duration / total) * 100}%, 3px)`,
                  }}
                >
                  <span
                    className={cn(
                      "block h-3 w-full rounded-[4px] transition-opacity hover:opacity-80",
                      selected === row.span.spanId && "ring-ink/40 ring-2",
                    )}
                    style={{ background: category.color }}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {tooltip}
    </div>
  );
}

function SpanDetail({ span, onClose }: { span: TraceSpan; onClose: () => void }) {
  return (
    <div className="border-line bg-canvas mt-4 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-ink text-sm font-semibold">{span.name}</p>
          <p className="text-ink-muted text-xs">
            {ms(span.durationMs)} · {span.kind === "client" ? "external call" : "internal"} ·{" "}
            {span.status === "error" ? (
              <span className="text-[var(--color-status-critical)]">⚠ failed</span>
            ) : (
              "ok"
            )}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink text-xs">
          Close
        </button>
      </div>
      {span.errorMessage && (
        <p className="mt-2 text-xs text-[var(--color-status-critical)]">{span.errorMessage}</p>
      )}
      <pre className="bg-surface text-ink mt-3 max-h-64 overflow-auto rounded p-3 text-[11px]">
        {JSON.stringify(span.attributes, null, 2)}
      </pre>
    </div>
  );
}

function StageBreakdown({
  stages,
}: {
  stages: Array<{
    stage: string;
    ms: number;
    llmMs: number;
    toolMs: number;
    costUsd: number | null;
  }>;
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip();
  const max = Math.max(...stages.map((s) => s.ms), 1);
  const parts = (s: (typeof stages)[number]) => {
    const other = Math.max(s.ms - s.llmMs - s.toolMs, 0);
    return [
      { key: "LLM calls", value: s.llmMs, color: "var(--color-viz-2)" },
      { key: "Tool calls", value: s.toolMs, color: "var(--color-viz-3)" },
      { key: "Other", value: other, color: "var(--color-viz-muted)" },
    ].filter((p) => p.value > 0);
  };

  return (
    <ChartCard
      title="Time per stage"
      description="Where each stage spent its time. Cost comes from that stage's LLM calls."
      legend={
        <Legend
          items={[
            { label: "LLM calls", color: "var(--color-viz-2)" },
            { label: "Tool calls", color: "var(--color-viz-3)" },
            { label: "Other (our code, waiting)", color: "var(--color-viz-muted)" },
          ]}
        />
      }
      table={
        <DataTable
          columns={["Stage", "Total", "LLM", "Tools", "Cost"]}
          rows={stages.map((s) => [s.stage, ms(s.ms), ms(s.llmMs), ms(s.toolMs), usd(s.costUsd)])}
        />
      }
    >
      <div ref={containerRef} className="relative space-y-2.5">
        {stages.map((s) => (
          <div key={s.stage} className="grid grid-cols-[minmax(0,7rem)_1fr] items-center gap-3">
            <span className="text-ink-muted truncate text-xs capitalize">{s.stage}</span>
            <div className="flex items-center gap-2">
              {/* Segments are separated by a 2px surface gap, not a border. */}
              <div
                className="flex h-6 items-center gap-0.5"
                style={{ width: `${Math.max((s.ms / max) * 100, 1)}%` }}
              >
                {parts(s).map((p, i, all) => (
                  <button
                    key={p.key}
                    type="button"
                    aria-label={`${s.stage}, ${p.key}: ${ms(p.value)}`}
                    onPointerEnter={(e) =>
                      show(e.currentTarget, { value: ms(p.value), label: `${s.stage} · ${p.key}` })
                    }
                    onPointerLeave={hide}
                    onFocus={(e) =>
                      show(e.currentTarget, { value: ms(p.value), label: `${s.stage} · ${p.key}` })
                    }
                    onBlur={hide}
                    className="focus-visible:outline-brand-600 flex h-full items-center focus-visible:outline-2"
                    style={{ flexGrow: p.value, flexBasis: 0, minWidth: 2 }}
                  >
                    <span
                      className={cn(
                        "block h-3 w-full hover:opacity-80",
                        i === all.length - 1 && "rounded-r-[4px]",
                      )}
                      style={{ background: p.color }}
                    />
                  </button>
                ))}
              </div>
              <span className="text-ink shrink-0 text-xs tabular-nums">
                {ms(s.ms)}
                {s.costUsd ? <span className="text-ink-muted"> · {usd(s.costUsd)}</span> : null}
              </span>
            </div>
          </div>
        ))}
        {tooltip}
      </div>
    </ChartCard>
  );
}
