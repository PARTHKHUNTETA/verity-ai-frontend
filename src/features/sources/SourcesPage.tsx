import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { SourcesIcon } from "@/components/ui/icons";
import { useAuth } from "@/features/auth/auth-context";
import { errorMessage } from "@/services/api-client";
import { sourcesApi } from "@/services/sources-api";
import { NewCollectionForm } from "./components/NewCollectionForm";
import { SearchTester } from "./components/SearchTester";

export function SourcesPage() {
  const { can } = useAuth();
  const [creating, setCreating] = useState(false);
  const collections = useQuery({ queryKey: ["collections"], queryFn: sourcesApi.listCollections });

  return (
    <>
      <PageHeader
        title="Sources"
        description="Collections of papers, reports and notes. Research runs search them and cite exact passages."
        actions={
          can("source:create") &&
          !creating && <Button onClick={() => setCreating(true)}>New collection</Button>
        }
      />
      <div className="space-y-6">
        {creating && <NewCollectionForm onDone={() => setCreating(false)} />}

        {collections.isPending && (
          <div className="text-brand-600 flex justify-center py-10">
            <Spinner />
          </div>
        )}
        {collections.isError && <Alert>{errorMessage(collections.error)}</Alert>}
        {collections.isSuccess && collections.data.length === 0 && !creating && (
          <Card className="flex flex-col items-center px-6 py-14 text-center">
            <div className="bg-brand-50 text-brand-600 mb-4 flex size-12 items-center justify-center rounded-full">
              <SourcesIcon />
            </div>
            <h2 className="text-ink text-base font-semibold">No collections yet</h2>
            <p className="text-ink-muted mt-1 max-w-md text-sm">
              Create a collection and upload PDFs or notes. VerityAI indexes them so research
              answers can cite the exact passages they rely on.
            </p>
          </Card>
        )}
        {collections.isSuccess && collections.data.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2">
            {collections.data.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/sources/collections/${c.id}`}
                  className="border-line bg-surface hover:border-brand-500 block rounded-xl border p-5 shadow-sm transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-ink font-semibold">{c.name}</h2>
                    <span className="bg-canvas text-ink-muted shrink-0 rounded-full px-2 py-0.5 text-xs">
                      {c.visibility === "private" ? "Private" : "Organization"}
                    </span>
                  </div>
                  <p className="text-ink-muted mt-2 text-sm">
                    {c.sourceCount} document{c.sourceCount === 1 ? "" : "s"}
                    {c.sourceCount > 0 && ` · ${c.readyCount} ready`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {collections.isSuccess && collections.data.some((c) => c.readyCount > 0) && (
          <SearchTester />
        )}
      </div>
    </>
  );
}
