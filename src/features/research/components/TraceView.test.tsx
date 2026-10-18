import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithAuth, testMe } from "@/test/render";
import type { RunTrace, TraceSpan } from "@/types/api";
import { TraceView } from "./TraceView";

const api = vi.hoisted(() => ({ runTrace: vi.fn(), metrics: vi.fn() }));
vi.mock("@/services/observability-api", () => ({ observabilityApi: api }));

const t = (s: number) => new Date(Date.UTC(2026, 9, 18, 10, 0, s)).toISOString();
function span(
  id: string,
  name: string,
  parent: string | null,
  start: number,
  end: number,
  extra: Partial<TraceSpan> = {},
): TraceSpan {
  return {
    spanId: id,
    traceId: "run",
    parentSpanId: parent,
    name,
    kind: "internal",
    status: "ok",
    attributes: {},
    errorMessage: null,
    startTime: t(start),
    endTime: t(end),
    durationMs: (end - start) * 1000,
    ...extra,
  };
}

const trace: RunTrace = {
  traceId: "run",
  spans: [
    span("synth", "stage.synthesizing", "root", 4, 10),
    span("root", "run", null, 0, 10),
    span("plan", "stage.planning", "root", 0, 4),
    span("llm1", "llm.generateObject", "plan", 0, 3, {
      kind: "client",
      attributes: { model: "gpt-5-mini" },
    }),
    span("fetch", "tool.fetch", "plan", 3, 4, { status: "error", errorMessage: "HTTP 500" }),
  ],
  summary: {
    totalMs: 10_000,
    llm: { calls: 1, ms: 3000, costUsd: 0.0012, tokensInput: 1200, tokensOutput: 300 },
    tools: { calls: 1, ms: 1000, denied: 0, failed: 1, cached: 0 },
    stages: [
      { stage: "planning", ms: 4000, llmMs: 3000, toolMs: 1000, costUsd: 0.0012 },
      { stage: "synthesizing", ms: 6000, llmMs: 0, toolMs: 0, costUsd: 0 },
    ],
    slowest: [{ spanId: "llm1", name: "llm.generateObject", ms: 3000, detail: "gpt-5-mini" }],
    errors: [{ spanId: "fetch", name: "tool.fetch", message: "HTTP 500" }],
  },
};

describe("TraceView", () => {
  it("shows totals, nests spans under their parents, and flags failures with an icon", async () => {
    api.runTrace.mockResolvedValue(trace);
    renderWithAuth([{ path: "/", element: <TraceView runId="run" refreshKey="x" /> }], {
      state: { status: "authenticated", me: testMe },
    });

    const totalTile = (await screen.findByText("Total time")).parentElement!;
    expect(totalTile).toHaveTextContent("10.0 s");
    expect(screen.getByText("$0.0012")).toBeInTheDocument();

    // Depth-first order: run → planning → its children → synthesizing.
    const bars = screen
      .getAllByRole("button", { pressed: false })
      .map((b) => b.getAttribute("aria-label"));
    expect(bars).toEqual([
      "run: 10.0 s",
      "stage.planning: 4.0 s",
      "llm.generateObject: 3.0 s",
      "tool.fetch: 1.0 s, failed",
      "stage.synthesizing: 6.0 s",
    ]);
    expect(screen.getByLabelText("failed")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("tool.fetch (HTTP 500)");

    // The per-stage time split is labeled, not color-only.
    expect(screen.getByLabelText("planning, LLM calls: 3.0 s")).toBeInTheDocument();
  });

  it("offers a table view of every span", async () => {
    api.runTrace.mockResolvedValue(trace);
    renderWithAuth([{ path: "/", element: <TraceView runId="run" refreshKey="x" /> }], {
      state: { status: "authenticated", me: testMe },
    });
    await screen.findByText("Waterfall");
    const waterfallCard = screen.getByText("Waterfall").closest("div.p-5") as HTMLElement;
    await userEvent.click(within(waterfallCard).getByRole("tab", { name: "table" }));
    expect(within(waterfallCard).getByRole("table")).toHaveTextContent("tool.fetch");
    expect(within(waterfallCard).getByRole("table")).toHaveTextContent("error");
  });
});
