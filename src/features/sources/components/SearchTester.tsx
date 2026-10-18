import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { errorMessage } from "@/services/api-client";
import { formatPages, sourcesApi } from "@/services/sources-api";

/**
 * Runs the same hybrid search research runs use, so you can see what the agent would read.
 * Each hit shows its rank in the vector list and the keyword list before fusion.
 */
export function SearchTester() {
  const [query, setQuery] = useState("");
  const search = useMutation({ mutationFn: (q: string) => sourcesApi.search(q) });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim().length >= 2) search.mutate(query.trim());
  }

  return (
    <Card>
      <div className="border-line border-b px-5 py-4">
        <h2 className="text-ink text-sm font-semibold">Try a search</h2>
        <p className="text-ink-muted mt-0.5 text-xs">
          See which passages the agent would retrieve for a question (vector + keyword search,
          merged with reciprocal rank fusion).
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex gap-2 p-5 pb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. how do agents plan?"
          aria-label="Search query"
          className="border-line bg-surface placeholder:text-ink-subtle focus:outline-brand-500 block w-full rounded-lg border px-3 py-2 text-sm focus:outline-2"
        />
        <Button type="submit" variant="secondary" loading={search.isPending}>
          Search
        </Button>
      </form>
      <div className="px-5 pb-5">
        {search.isError && <Alert>{errorMessage(search.error)}</Alert>}
        {search.isSuccess && search.data.length === 0 && (
          <p className="text-ink-muted text-sm">No matching passages in your ready documents.</p>
        )}
        {search.isSuccess && search.data.length > 0 && (
          <ol className="space-y-3">
            {search.data.map((hit, i) => (
              <li key={hit.chunkId} className="border-line rounded-lg border p-3">
                <div className="text-ink-muted flex flex-wrap items-center justify-between gap-2 text-xs">
                  <Link
                    to={`/sources/${hit.sourceId}?chunk=${hit.chunkId}`}
                    className="text-brand-600 hover:text-brand-700 font-medium"
                  >
                    {i + 1}. {hit.sourceTitle}
                    {formatPages(hit.pageStart, hit.pageEnd) &&
                      ` · ${formatPages(hit.pageStart, hit.pageEnd)}`}
                  </Link>
                  <span>
                    score {hit.score.toFixed(4)} · vector #{hit.vectorRank ?? "—"} · keyword #
                    {hit.keywordRank ?? "—"}
                  </span>
                </div>
                <p className="text-ink mt-2 line-clamp-3 text-sm">{hit.content}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}
