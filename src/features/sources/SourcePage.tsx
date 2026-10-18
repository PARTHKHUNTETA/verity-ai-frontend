import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { errorMessage } from "@/services/api-client";
import { formatBytes, formatPages, sourcesApi } from "@/services/sources-api";
import { SourceStatusBadge } from "./components/SourceStatusBadge";

/** A document and its chunks. `?chunk=<id>` scrolls to and highlights one chunk (from a citation). */
export function SourcePage() {
  const { sourceId = "" } = useParams<{ sourceId: string }>();
  const [params] = useSearchParams();
  const highlight = params.get("chunk");

  const source = useQuery({
    queryKey: ["source", sourceId],
    queryFn: () => sourcesApi.getSource(sourceId),
  });
  const chunks = useQuery({
    queryKey: ["source", sourceId, "chunks"],
    queryFn: () => sourcesApi.listChunks(sourceId),
    enabled: source.data?.status === "ready",
  });

  useEffect(() => {
    if (highlight && chunks.isSuccess) {
      document
        .getElementById(`chunk-${highlight}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlight, chunks.isSuccess]);

  if (source.isPending) return <FullPageSpinner />;
  if (source.isError) return <Alert>{errorMessage(source.error)}</Alert>;
  const s = source.data;

  return (
    <div className="space-y-6">
      {s.collections[0] && (
        <Link
          to={`/sources/collections/${s.collections[0].id}`}
          className="text-ink-muted hover:text-ink text-sm"
        >
          ← {s.collections[0].name}
        </Link>
      )}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-ink text-xl font-semibold tracking-tight">{s.title}</h1>
          <SourceStatusBadge status={s.status} />
        </div>
        <p className="text-ink-muted mt-1 text-sm">
          {[
            s.authors?.join(", "),
            s.fileName,
            formatBytes(s.sizeBytes),
            s.pageCount && `${s.pageCount} pages`,
            s.chunkCount && `${s.chunkCount} chunks`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {s.status === "failed" && <Alert>{s.error ?? "Processing failed."}</Alert>}
      {(s.status === "pending" || s.status === "processing") && (
        <Alert tone="info">This document is still being processed.</Alert>
      )}

      {chunks.isPending && s.status === "ready" && (
        <div className="text-brand-600 flex justify-center py-10">
          <Spinner />
        </div>
      )}
      {chunks.isSuccess && (
        <div className="space-y-3">
          <h2 className="text-ink text-sm font-semibold">
            Chunks <span className="text-ink-muted font-normal">(what retrieval searches)</span>
          </h2>
          {chunks.data.map((chunk) => (
            <Card
              key={chunk.id}
              id={`chunk-${chunk.id}`}
              className={cn(
                "scroll-mt-24 p-4",
                chunk.id === highlight && "border-brand-500 ring-brand-100 ring-2",
              )}
            >
              <p className="text-ink-muted mb-2 text-xs">
                #{chunk.chunkIndex + 1}
                {formatPages(chunk.pageStart, chunk.pageEnd) &&
                  ` · ${formatPages(chunk.pageStart, chunk.pageEnd)}`}
                {` · ~${chunk.tokenCount} tokens`}
                {chunk.id === highlight && (
                  <span className="text-brand-700 ml-2 font-medium">Cited passage</span>
                )}
              </p>
              <p className="text-ink text-sm whitespace-pre-line">{chunk.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
