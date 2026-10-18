import type {
  EvalCase,
  EvalCaseInput,
  EvalComparison,
  EvalDataset,
  EvalRun,
  EvalRunDetail,
} from "@/types/api";
import { apiRequest } from "./api-client";

export type StartEvalRunInput = {
  datasetId: string;
  name: string;
  model?: string;
  topK: number;
  discovery: boolean;
  revise: boolean;
  limit?: number | null;
};

/** Offline evaluation (see verity-ai-backend/src/modules/evaluation/evaluation.routes.ts). */
export const evalsApi = {
  listDatasets: async () =>
    (await apiRequest<{ datasets: EvalDataset[] }>("/evals/datasets")).datasets,
  createDataset: (input: { name: string; description?: string | null }) =>
    apiRequest<EvalDataset>("/evals/datasets", { method: "POST", body: input }),
  installStarter: () => apiRequest<EvalDataset>("/evals/datasets/starter", { method: "POST" }),
  getDataset: (id: string) =>
    apiRequest<EvalDataset & { cases: EvalCase[] }>(`/evals/datasets/${id}`),
  deleteDataset: (id: string) => apiRequest<void>(`/evals/datasets/${id}`, { method: "DELETE" }),
  addCase: (datasetId: string, input: EvalCaseInput) =>
    apiRequest<EvalCase>(`/evals/datasets/${datasetId}/cases`, { method: "POST", body: input }),
  updateCase: (datasetId: string, caseId: string, input: EvalCaseInput) =>
    apiRequest<EvalCase>(`/evals/datasets/${datasetId}/cases/${caseId}`, {
      method: "PUT",
      body: input,
    }),
  deleteCase: (datasetId: string, caseId: string) =>
    apiRequest<void>(`/evals/datasets/${datasetId}/cases/${caseId}`, { method: "DELETE" }),

  listRuns: async (datasetId?: string) =>
    (
      await apiRequest<{ runs: EvalRun[] }>(
        `/evals/runs${datasetId ? `?datasetId=${datasetId}` : ""}`,
      )
    ).runs,
  startRun: (input: StartEvalRunInput) =>
    apiRequest<EvalRun>("/evals/runs", { method: "POST", body: input }),
  getRun: (id: string) => apiRequest<EvalRunDetail>(`/evals/runs/${id}`),
  cancelRun: (id: string) => apiRequest<EvalRun>(`/evals/runs/${id}/cancel`, { method: "POST" }),
  compare: (a: string, b: string) => apiRequest<EvalComparison>(`/evals/compare?a=${a}&b=${b}`),
};
