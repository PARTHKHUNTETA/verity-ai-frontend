import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { errorMessage } from "@/services/api-client";
import { formatBytes, sourcesApi } from "@/services/sources-api";
import { SourceStatusBadge } from "./components/SourceStatusBadge";
import { UploadDropzone } from "./components/UploadDropzone";

export function CollectionPage() {
  const { collectionId = "" } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const collection = useQuery({
    queryKey: ["collection", collectionId],
    queryFn: () => sourcesApi.getCollection(collectionId),
    // Poll while documents are still being processed by the worker.
    refetchInterval: (query) =>
      query.state.data?.sources.some((s) => s.status === "pending" || s.status === "processing")
        ? 2000
        : false,
  });

  const remove = useMutation({
    mutationFn: (sourceId: string) => sourcesApi.removeFromCollection(collectionId, sourceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collection", collectionId] }),
  });

  const deleteCollection = useMutation({
    mutationFn: () => sourcesApi.deleteCollection(collectionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["collections"] });
      navigate("/sources");
    },
  });

  if (collection.isPending) return <FullPageSpinner />;
  if (collection.isError) return <Alert>{errorMessage(collection.error)}</Alert>;
  const c = collection.data;

  return (
    <div className="space-y-6">
      <Link to="/sources" className="text-ink-muted hover:text-ink text-sm">
        ← All collections
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-ink text-xl font-semibold tracking-tight">{c.name}</h1>
          <p className="text-ink-muted mt-1 text-sm">
            {c.visibility === "private" ? "Private collection" : "Visible to your organization"} ·{" "}
            {c.sources.length} document{c.sources.length === 1 ? "" : "s"}
          </p>
        </div>
        {c.canEdit && (
          <Button
            variant="ghost"
            loading={deleteCollection.isPending}
            onClick={() => {
              if (
                window.confirm(
                  `Delete the collection "${c.name}"? Documents stay available in other collections.`,
                )
              ) {
                deleteCollection.mutate();
              }
            }}
          >
            Delete collection
          </Button>
        )}
      </div>

      {c.canEdit && <UploadDropzone collectionId={collectionId} />}
      {remove.isError && <Alert>{errorMessage(remove.error)}</Alert>}

      <Card>
        {c.sources.length === 0 ? (
          <p className="text-ink-muted px-5 py-10 text-center text-sm">
            No documents yet.{c.canEdit && " Upload a PDF or text file above."}
          </p>
        ) : (
          <ul className="divide-line divide-y">
            {c.sources.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <Link
                    to={`/sources/${s.id}`}
                    className="text-ink hover:text-brand-700 block truncate text-sm font-medium"
                  >
                    {s.title}
                  </Link>
                  <p className="text-ink-muted truncate text-xs">
                    {s.fileName !== s.title && s.fileName ? `${s.fileName} · ` : ""}
                    {formatBytes(s.sizeBytes)}
                    {s.pageCount ? ` · ${s.pageCount} pages` : ""}
                    {s.status === "failed" && s.error ? ` · ${s.error}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <SourceStatusBadge status={s.status} />
                  {c.canEdit && (
                    <button
                      type="button"
                      onClick={() => remove.mutate(s.id)}
                      className="text-ink-muted text-xs hover:text-red-600"
                      aria-label={`Remove ${s.title} from this collection`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
