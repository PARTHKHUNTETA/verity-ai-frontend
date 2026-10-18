import type {
  ResearchCapabilities,
  Run,
  RunDetail,
  RunStage,
  RunStatus,
  TaskSummary,
} from "@/types/api";
import { apiRequest, openStream } from "./api-client";
import { readSse } from "./sse";

/** Messages on GET /research/runs/:id/stream (see verity-ai-backend/src/modules/research/research.sse.ts). */
export type RunStreamMessage =
  | { type: "snapshot"; detail: RunDetail }
  | { type: "status"; status: RunStatus; stage: RunStage | null }
  /** `version`: the report version (2 = the revision written after evaluation). */
  | { type: "delta"; offset: number; text: string; version: number }
  | { type: "done" };

export const researchApi = {
  capabilities: () => apiRequest<ResearchCapabilities>("/research/capabilities"),

  createTask: (input: { question: string; instructions?: string; discover?: boolean }) =>
    apiRequest<{ task: TaskSummary; run: Run }>("/research/tasks", { method: "POST", body: input }),

  listTasks: async () => (await apiRequest<{ tasks: TaskSummary[] }>("/research/tasks")).tasks,

  getRun: (runId: string) => apiRequest<RunDetail>(`/research/runs/${runId}`),

  /** Thumbs up/down on a report or one of its claims; rating 0 removes it. */
  rateReport: (input: { reportId: string; claimId?: string; rating: -1 | 0 | 1 }) =>
    apiRequest<{ rating: -1 | 1 | null; comment: string | null }>("/feedback", {
      method: "POST",
      body: input,
    }),

  rerun: (taskId: string) => apiRequest<Run>(`/research/tasks/${taskId}/runs`, { method: "POST" }),

  cancelRun: (runId: string) =>
    apiRequest<Run>(`/research/runs/${runId}/cancel`, { method: "POST" }),

  /** Opens the run's event stream and yields typed messages until the server closes it. */
  async *streamRun(runId: string, signal: AbortSignal): AsyncGenerator<RunStreamMessage> {
    const res = await openStream(`/research/runs/${runId}/stream`, signal);
    for await (const { event, data } of readSse(res.body!)) {
      const payload = JSON.parse(data);
      switch (event) {
        case "snapshot":
          yield { type: "snapshot", detail: payload as RunDetail };
          break;
        case "status":
          yield { type: "status", status: payload.status, stage: payload.stage };
          break;
        case "delta":
          yield {
            type: "delta",
            offset: payload.offset,
            text: payload.text,
            version: payload.version ?? 1,
          };
          break;
        case "done":
          yield { type: "done" };
          return;
      }
    }
  },
};
