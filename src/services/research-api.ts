import type { Run, RunDetail, RunStage, RunStatus, TaskSummary } from "@/types/api";
import { apiRequest, openStream } from "./api-client";
import { readSse } from "./sse";

/** Messages on GET /research/runs/:id/stream (see verity-ai-backend/src/modules/research/research.sse.ts). */
export type RunStreamMessage =
  | { type: "snapshot"; detail: RunDetail }
  | { type: "status"; status: RunStatus; stage: RunStage | null }
  | { type: "delta"; offset: number; text: string }
  | { type: "done" };

export const researchApi = {
  createTask: (input: { question: string; instructions?: string }) =>
    apiRequest<{ task: TaskSummary; run: Run }>("/research/tasks", { method: "POST", body: input }),

  listTasks: async () => (await apiRequest<{ tasks: TaskSummary[] }>("/research/tasks")).tasks,

  getRun: (runId: string) => apiRequest<RunDetail>(`/research/runs/${runId}`),

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
          yield { type: "delta", offset: payload.offset, text: payload.text };
          break;
        case "done":
          yield { type: "done" };
          return;
      }
    }
  },
};
