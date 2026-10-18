import type { ReportDetail, ReportSummary } from "@/types/api";
import { apiRequest, downloadFile } from "./api-client";

export type ExportFormat = "md" | "pdf";

export const reportsApi = {
  list: async (q?: string) =>
    (
      await apiRequest<{ reports: ReportSummary[] }>(
        `/reports${q ? `?q=${encodeURIComponent(q)}` : ""}`,
      )
    ).reports,
  get: (id: string) => apiRequest<ReportDetail>(`/reports/${id}`),
  /** Downloads the report as Markdown or PDF, with evidence notes and a bibliography. */
  download: (id: string, format: ExportFormat) =>
    downloadFile(`/reports/${id}/export?format=${format}`, `report.${format}`),
};
