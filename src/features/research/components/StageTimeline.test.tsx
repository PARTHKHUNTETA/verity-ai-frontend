import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AgentStep, RunDetail } from "@/types/api";
import { StageTimeline } from "./StageTimeline";

function step(
  seq: number,
  stage: AgentStep["stage"],
  output: Record<string, unknown>,
  type: AgentStep["type"] = "llm_call",
): AgentStep {
  return {
    seq,
    stage,
    type,
    input: null,
    output,
    model: null,
    tokensInput: null,
    tokensOutput: null,
    costUsd: null,
    durationMs: 1000,
    createdAt: "",
  };
}

function detail(overrides: Partial<RunDetail["run"]>, steps: AgentStep[] = []): RunDetail {
  return {
    run: {
      id: "r",
      taskId: "t",
      status: "running",
      stage: "extracting",
      model: "m",
      promptVersion: "pipeline-v1",
      discovery: false,
      tokensInput: 0,
      tokensOutput: 0,
      costUsd: 0,
      errorCode: null,
      errorMessage: null,
      startedBy: null,
      createdAt: "",
      startedAt: null,
      completedAt: null,
      durationMs: null,
      ...overrides,
    },
    task: { id: "t", question: "Q", instructions: null, createdBy: null, createdAt: "" },
    report: null,
    citations: [],
    discovered: [],
    subQuestions: [
      {
        id: "a",
        position: 1,
        text: "A?",
        rationale: null,
        searchQueries: [],
        coverage: "pending",
        evidenceCount: 0,
      },
      {
        id: "b",
        position: 2,
        text: "B?",
        rationale: null,
        searchQueries: [],
        coverage: "pending",
        evidenceCount: 0,
      },
    ],
    steps,
    toolCalls: [],
    approvals: [],
    decisions: [],
  };
}

describe("StageTimeline", () => {
  it("marks earlier stages done with a summary and the current stage as running", () => {
    render(
      <StageTimeline
        detail={detail({ stage: "extracting" }, [
          step(1, "planning", {}),
          step(2, "retrieving", { passages: 6 }, "tool_call"),
        ])}
      />,
    );
    expect(screen.getByText("2 sub-questions · 1.0 s")).toBeInTheDocument();
    expect(screen.getByText("6 passages · 1.0 s")).toBeInTheDocument();
    expect(screen.getByText("Extract").closest("li")).toHaveAttribute("aria-current", "step");
    // Discovery stages are hidden when the run doesn't search the web.
    expect(screen.queryByText("Search")).not.toBeInTheDocument();
  });

  it("shows discovery stages and marks the failing stage", () => {
    render(
      <StageTimeline detail={detail({ discovery: true, status: "failed", stage: "acquiring" })} />,
    );
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Read").closest("li")?.className).toMatch(/red/);
  });
});
