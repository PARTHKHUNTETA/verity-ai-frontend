import { describe, expect, it } from "vitest";
import type { RunDetail } from "@/types/api";
import { initialRunStreamState, runStreamReducer, type RunStreamState } from "./run-stream-state";

function detail(content: string, reportStatus: "draft" | "final" = "draft"): RunDetail {
  return {
    run: {
      id: "r1",
      taskId: "t1",
      status: reportStatus === "final" ? "completed" : "running",
      stage: "synthesizing",
      model: "fake-model",
      promptVersion: "answer-v0",
      tokensInput: 0,
      tokensOutput: 0,
      costUsd: 0,
      errorCode: null,
      errorMessage: null,
      startedBy: "u1",
      createdAt: "2026-10-18T00:00:00Z",
      startedAt: null,
      completedAt: null,
      durationMs: null,
    },
    task: { id: "t1", question: "Q?", instructions: null, createdBy: "u1", createdAt: "" },
    report: { id: "rep1", version: 1, status: reportStatus, contentMd: content },
    citations: [],
  };
}

const apply = (state: RunStreamState, ...messages: Parameters<typeof runStreamReducer>[1][]) =>
  messages.reduce(runStreamReducer, state);

describe("runStreamReducer", () => {
  it("appends deltas in order", () => {
    const s = apply(
      initialRunStreamState,
      { type: "snapshot", detail: detail("") },
      { type: "delta", offset: 0, text: "Hello " },
      { type: "delta", offset: 6, text: "world" },
    );
    expect(s.content).toBe("Hello world");
  });

  it("ignores deltas it already has (e.g. after reconnecting)", () => {
    const s = apply(
      initialRunStreamState,
      { type: "snapshot", detail: detail("Hello world") },
      { type: "delta", offset: 0, text: "Hello " },
    );
    expect(s.content).toBe("Hello world");
  });

  it("appends only the new part of an overlapping delta", () => {
    const s = apply(
      initialRunStreamState,
      { type: "snapshot", detail: detail("Hello wo") },
      { type: "delta", offset: 6, text: "world!" },
    );
    expect(s.content).toBe("Hello world!");
  });

  it("flags a gap when text is missing", () => {
    const s = apply(
      initialRunStreamState,
      { type: "snapshot", detail: detail("Hello") },
      { type: "delta", offset: 10, text: "later text" },
    );
    expect(s.gap).toBe(true);
    expect(s.content).toBe("Hello");
  });

  it("keeps live text when a snapshot lags behind it, but trusts a final report", () => {
    const live = apply(
      initialRunStreamState,
      { type: "snapshot", detail: detail("") },
      { type: "delta", offset: 0, text: "Hello world" },
    );
    expect(runStreamReducer(live, { type: "snapshot", detail: detail("Hello") }).content).toBe(
      "Hello world",
    );
    expect(
      runStreamReducer(live, { type: "snapshot", detail: detail("Final text", "final") }).content,
    ).toBe("Final text");
  });

  it("updates status and marks the stream finished", () => {
    const s = apply(
      initialRunStreamState,
      { type: "snapshot", detail: detail("") },
      { type: "status", status: "completed", stage: "synthesizing" },
      { type: "done" },
    );
    expect(s.detail?.run.status).toBe("completed");
    expect(s.finished).toBe(true);
  });
});
