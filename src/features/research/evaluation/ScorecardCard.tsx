import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import type { Scorecard } from "@/types/api";
import { pct } from "./verdict";

/**
 * The trust scorecard (docs/system-design.md §6.1): one tile per metric with its target.
 * Each metric is a single number against a threshold, so it is a stat tile with a small
 * meter, not a chart. Below-target status is shown with an icon and words, never color alone.
 */

type Metric = {
  key: string;
  label: string;
  value: number | null;
  target: number | null;
  help: string;
  /** Shown when the value is null. */
  empty?: string;
};

function metricsOf(s: Scorecard): Metric[] {
  return [
    {
      key: "claimSupportRate",
      label: "Claim support",
      value: s.claimSupportRate,
      target: 0.9,
      help: "Cited claims whose evidence supports them (partly supported counts half).",
    },
    {
      key: "citationAccuracy",
      label: "Citation accuracy",
      value: s.citationAccuracy,
      target: 0.9,
      help: "Citations whose passage supports the sentence they are attached to.",
    },
    {
      key: "citationValidity",
      label: "Citation validity",
      value: s.citationValidity,
      target: 1,
      help: "Citations that point at real evidence from a source that still exists.",
    },
    {
      key: "sourceReliability",
      label: "Source reliability",
      value: s.sourceReliability,
      target: 0.7,
      help: "Average reliability of the cited sources (publisher type and age).",
    },
    {
      key: "coverage",
      label: "Coverage",
      value: s.coverage,
      target: 0.8,
      help: "Planned sub-questions answered with cited evidence.",
    },
    {
      key: "taskCompletion",
      label: "Task completion",
      value: s.taskCompletion,
      target: 0.8,
      help: "How completely the report does what was asked (judged by a model).",
    },
    {
      key: "contradictionHandling",
      label: "Contradictions cited",
      value: s.extra.contradictionHandling,
      target: null,
      help: "Share of contradicting evidence the report mentions. Informational: no target.",
      empty: "no contradicting evidence",
    },
  ];
}

export function ScorecardCard({ scorecard }: { scorecard: Scorecard | null }) {
  if (!scorecard) return null;
  const { extra } = scorecard;
  const below = extra.flags.length;
  const revision = extra.revision;

  return (
    <Card>
      <div className="border-line flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
        <h2 className="text-ink text-sm font-semibold">Trust scorecard</h2>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            scorecard.passed ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800",
          )}
        >
          <span aria-hidden="true">{scorecard.passed ? "✓" : "▲"}</span>
          {scorecard.passed
            ? "Meets every target"
            : below
              ? `${below} ${below === 1 ? "metric" : "metrics"} below target`
              : "Not fully verified"}
        </span>
      </div>

      {revision && (
        <p className="border-line text-ink-muted border-b px-5 py-2.5 text-xs">
          <span className="text-ink font-medium">Revised once after fact-checking: </span>
          claim support {pct(revision.before.claimSupportRate)} in the first draft →{" "}
          {pct(scorecard.claimSupportRate)}
          {revision.kept === "original" &&
            " (the revision scored lower, so the first draft is shown)"}
          .
        </p>
      )}
      {extra.judgeError && (
        <p className="border-line border-b bg-amber-50/60 px-5 py-2.5 text-xs text-amber-800">
          <span aria-hidden="true">▲ </span>
          The fact-checking model failed, so claims are unverified. {extra.judgeError}
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        {metricsOf(scorecard).map((m) => (
          <MetricTile key={m.key} metric={m} />
        ))}
        <PolicyTile compliant={scorecard.policyCompliant} />
      </ul>

      <Details scorecard={scorecard} />
    </Card>
  );
}

function MetricTile({ metric }: { metric: Metric }) {
  const { label, value, target, help } = metric;
  const meets = value === null || target === null ? null : value >= target;
  return (
    <li className="border-line rounded-lg border px-3 py-2.5" title={help}>
      <p className="text-ink-muted text-xs">{label}</p>
      <p className="text-ink mt-0.5 text-lg font-semibold">{pct(value)}</p>
      {/* Meter: the value as a bar, the target as a tick. */}
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value === null ? undefined : Math.round(value * 100)}
        className="bg-viz-grid relative mt-1.5 h-1.5 rounded-full"
      >
        {value !== null && (
          <div
            className="bg-viz-1 h-full rounded-full"
            style={{ width: `${Math.max(2, Math.min(100, value * 100))}%` }}
          />
        )}
        {target !== null && (
          <div
            aria-hidden="true"
            className="bg-ink absolute -top-0.5 h-2.5 w-0.5 rounded-full"
            style={{ left: `calc(${target * 100}% - 1px)` }}
          />
        )}
      </div>
      <p className="text-ink-muted mt-1.5 flex items-center gap-1 text-[11px]">
        {meets === null ? (
          value === null ? (
            (metric.empty ?? "not measured")
          ) : (
            "no target"
          )
        ) : (
          <>
            <span
              aria-hidden="true"
              className={meets ? "text-status-good" : "text-status-critical"}
            >
              {meets ? "✓" : "▲"}
            </span>
            {meets ? "meets" : "below"} target {pct(target)}
          </>
        )}
      </p>
    </li>
  );
}

function PolicyTile({ compliant }: { compliant: boolean }) {
  return (
    <li
      className="border-line rounded-lg border px-3 py-2.5"
      title="Every tool call that ran was allowed by the policy gateway or approved by a person."
    >
      <p className="text-ink-muted text-xs">Policy compliance</p>
      <p className="text-ink mt-0.5 text-lg font-semibold">
        {compliant ? "Compliant" : "Violation"}
      </p>
      <p className="text-ink-muted mt-3 flex items-center gap-1 text-[11px]">
        <span
          aria-hidden="true"
          className={compliant ? "text-status-good" : "text-status-critical"}
        >
          {compliant ? "✓" : "✕"}
        </span>
        {compliant ? "every tool call allowed" : "a tool call broke policy"}
      </p>
    </li>
  );
}

function Details({ scorecard }: { scorecard: Scorecard }) {
  const { extra } = scorecard;
  const task = extra.taskCompletion;
  return (
    <details className="border-line group border-t">
      <summary className="text-ink-muted hover:text-ink cursor-pointer px-5 py-2.5 text-xs font-medium">
        Why these scores
      </summary>
      <div className="text-ink-muted space-y-4 px-5 pb-4 text-xs">
        <p>
          {extra.claims.total} cited claims: {extra.claims.supported} supported,{" "}
          {extra.claims.partial} partly supported, {extra.claims.unsupported} unsupported.{" "}
          {extra.citations.supporting} of {extra.citations.total} citations support their sentence.
          {extra.citations.invalidNumbers.length > 0 &&
            ` Cited numbers with no evidence: ${extra.citations.invalidNumbers.join(", ")}.`}
          {extra.citations.unresolvable > 0 &&
            ` ${extra.citations.unresolvable} citations point at sources that were deleted.`}
        </p>

        {task && (
          <div>
            <p className="text-ink font-medium">Task completion</p>
            {task.rationale && <p>{task.rationale}</p>}
            {task.missing.length > 0 && (
              <ul className="mt-1 list-disc pl-4">
                {task.missing.map((m) => (
                  <li key={m}>Missing: {m}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {extra.sources.length > 0 && (
          <div>
            <p className="text-ink font-medium">Cited sources</p>
            <table className="mt-1 w-full text-left">
              <thead className="sr-only">
                <tr>
                  <th>Source</th>
                  <th>Reliability</th>
                  <th>Why</th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {extra.sources.map((s) => (
                  <tr key={s.sourceId}>
                    <td className="text-ink py-1.5 pr-3">{s.title}</td>
                    <td className="text-ink py-1.5 pr-3 font-medium tabular-nums">
                      {pct(s.score)}
                    </td>
                    <td className="py-1.5">{s.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {extra.policy.violations.length > 0 && (
          <div>
            <p className="text-ink font-medium">Policy violations</p>
            <ul className="mt-1 list-disc pl-4">
              {extra.policy.violations.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-ink-subtle">
          Scores come from automatic checks and a judge model; they are a guide, not a guarantee.
          Use the thumbs on claims you disagree with.
        </p>
      </div>
    </details>
  );
}
