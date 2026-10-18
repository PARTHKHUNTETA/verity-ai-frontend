import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { errorMessage } from "@/services/api-client";
import { reportsApi, type ExportFormat } from "@/services/reports-api";

/** Download a report as Markdown or PDF (both include the evidence and a bibliography). */
export function ExportButtons({ reportId }: { reportId: string }) {
  const download = useMutation({
    mutationFn: (format: ExportFormat) => reportsApi.download(reportId, format),
  });
  const busy = download.isPending ? download.variables : null;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        className="px-3 py-1.5 text-xs"
        loading={busy === "pdf"}
        disabled={download.isPending}
        onClick={() => download.mutate("pdf")}
      >
        Download PDF
      </Button>
      <Button
        variant="secondary"
        className="px-3 py-1.5 text-xs"
        loading={busy === "md"}
        disabled={download.isPending}
        onClick={() => download.mutate("md")}
      >
        Markdown
      </Button>
      {download.isError && (
        <span role="alert" className="text-xs text-red-700">
          {errorMessage(download.error)}
        </span>
      )}
    </span>
  );
}
