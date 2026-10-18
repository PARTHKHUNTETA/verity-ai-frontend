import type { EvalCaseCategory, EvalRunStatus } from "@/types/api";

export const CATEGORY_LABELS: Record<EvalCaseCategory, string> = {
  normal: "Normal",
  edge: "Edge case",
  no_answer: "No answer",
  red_team: "Red team",
};

/** 0.875 → "88%"; null → "—". */
export function pct(value: number | null | undefined): string {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

export const isLive = (status: EvalRunStatus) => status === "queued" || status === "running";
