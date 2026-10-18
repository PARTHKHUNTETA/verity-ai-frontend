import { cn } from "@/components/ui/cn";
import type { RunDetail, RunStage } from "@/types/api";
import { formatDuration } from "../format";

const STAGES: Array<{ stage: RunStage; label: string; discovery?: boolean }> = [
  { stage: "planning", label: "Plan" },
  { stage: "discovering", label: "Search", discovery: true },
  { stage: "acquiring", label: "Read", discovery: true },
  { stage: "retrieving", label: "Retrieve" },
  { stage: "extracting", label: "Extract" },
  { stage: "analyzing", label: "Analyze" },
  { stage: "synthesizing", label: "Write" },
  { stage: "evaluating", label: "Check" },
];

type StageState = "done" | "current" | "waiting" | "failed" | "pending";

/** One-line result of a finished stage, from its recorded steps. */
function summarize(stage: RunStage, detail: RunDetail): string | null {
  const steps = detail.steps.filter((s) => s.stage === stage);
  const out = (key: string) =>
    steps.reduce(
      (sum, s) => sum + Number((s.output as Record<string, unknown> | null)?.[key] ?? 0),
      0,
    );
  switch (stage) {
    case "planning":
      return detail.subQuestions.length ? `${detail.subQuestions.length} sub-questions` : null;
    case "discovering":
      return `${out("candidates")} found`;
    case "acquiring":
      return `${out("acquired") + out("reused")} read`;
    case "retrieving":
      return `${out("passages")} passages`;
    case "extracting": {
      const rejected = steps.reduce(
        (sum, s) => sum + ((s.output as { rejected?: unknown[] } | null)?.rejected?.length ?? 0),
        0,
      );
      return `${out("accepted")} quotes${rejected ? ` · ${rejected} rejected` : ""}`;
    }
    case "analyzing": {
      const runs = steps.filter((s) => s.type === "tool_call").length;
      return runs ? `${runs} code run${runs === 1 ? "" : "s"}` : "no code";
    }
    case "synthesizing":
      return steps.length ? `${out("claims")} claims` : null;
    case "evaluating": {
      const card = detail.evaluation.scorecard;
      if (!card) return null;
      const support =
        card.claimSupportRate === null
          ? "unverified"
          : `${Math.round(card.claimSupportRate * 100)}% supported`;
      return card.extra.revision ? `${support} · revised` : support;
    }
    default:
      return null;
  }
}

/** The pipeline as a row of stages: done ✓, running (pulsing), upcoming, or failed. */
export function StageTimeline({ detail }: { detail: RunDetail }) {
  const { run } = detail;
  const stages = STAGES.filter((s) => !s.discovery || run.discovery);
  const currentIndex = stages.findIndex((s) => s.stage === run.stage);

  const stateOf = (i: number): StageState => {
    if (run.status === "completed") return "done";
    if (i < currentIndex) return "done";
    if (i === currentIndex) {
      if (run.status === "failed") return "failed";
      if (run.status === "awaiting_approval") return "waiting";
      if (run.status === "cancelled") return "pending";
      return "current";
    }
    return "pending";
  };

  return (
    <ol
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-4",
        run.discovery ? "lg:grid-cols-8" : "lg:grid-cols-6",
      )}
    >
      {stages.map(({ stage, label }, i) => {
        const state = stateOf(i);
        const duration = detail.steps
          .filter((s) => s.stage === stage)
          .reduce((sum, s) => sum + (s.durationMs ?? 0), 0);
        return (
          <li
            key={stage}
            className={cn(
              "rounded-lg border px-3 py-2",
              state === "done" && "border-emerald-200 bg-emerald-50/60",
              state === "current" && "border-brand-500 bg-brand-50",
              state === "waiting" && "border-amber-400 bg-amber-50",
              state === "failed" && "border-red-300 bg-red-50",
              state === "pending" && "border-line bg-surface",
            )}
            aria-current={state === "current" ? "step" : undefined}
          >
            <div className="text-ink flex items-center gap-1.5 text-xs font-semibold">
              <StageIcon state={state} />
              {label}
            </div>
            <p className="text-ink-muted mt-0.5 truncate text-[11px]">
              {state === "done" || state === "failed"
                ? [summarize(stage, detail), duration ? formatDuration(duration) : null]
                    .filter(Boolean)
                    .join(" · ") || "done"
                : state === "current"
                  ? "working…"
                  : state === "waiting"
                    ? "waiting for approval"
                    : "—"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function StageIcon({ state }: { state: StageState }) {
  if (state === "done") return <span className="text-emerald-600">✓</span>;
  if (state === "failed") return <span className="text-red-600">✕</span>;
  if (state === "waiting") return <span className="text-amber-600">⏸</span>;
  if (state === "current")
    return <span className="bg-brand-600 inline-block size-2 animate-pulse rounded-full" />;
  return <span className="bg-line inline-block size-2 rounded-full" />;
}
