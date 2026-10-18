import type { Metrics, RunTrace } from "@/types/api";
import { apiRequest } from "./api-client";

export const observabilityApi = {
  runTrace: (runId: string) => apiRequest<RunTrace>(`/research/runs/${runId}/trace`),
  metrics: (days: number) => apiRequest<Metrics>(`/observability/metrics?days=${days}`),
};
