import type { ApprovalRequest, Policy, PolicyRules } from "@/types/api";
import { apiRequest } from "./api-client";

export const approvalsApi = {
  list: async (status: "pending" | "all" = "pending") =>
    (await apiRequest<{ approvals: ApprovalRequest[] }>(`/approvals?status=${status}`)).approvals,

  pendingCount: async () => (await apiRequest<{ pending: number }>("/approvals/count")).pending,

  decide: (
    id: string,
    input: { decision: "approve" | "reject"; comment?: string; newLimit?: number },
  ) =>
    apiRequest<{ id: string; status: string }>(`/approvals/${id}/decision`, {
      method: "POST",
      body: input,
    }),
};

export const policiesApi = {
  active: () => apiRequest<Policy & { defaults: PolicyRules }>("/policies/active"),

  versions: async () =>
    (
      await apiRequest<{
        versions: Array<{ id: string; version: number; isActive: boolean; createdAt: string }>;
      }>("/policies/versions")
    ).versions,

  save: (rules: PolicyRules) =>
    apiRequest<Policy>("/policies/active", { method: "PUT", body: { rules } }),
};
