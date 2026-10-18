import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/auth-context";
import { errorMessage } from "@/services/api-client";
import { sourcesApi } from "@/services/sources-api";
import type { CollectionVisibility } from "@/types/api";

export function NewCollectionForm({ onDone }: { onDone: () => void }) {
  const { can } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Only owners/admins may create organization-wide collections.
  const canShare = can("collection:manage");
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<CollectionVisibility>(
    canShare ? "organization" : "private",
  );

  const create = useMutation({
    mutationFn: sourcesApi.createCollection,
    onSuccess: (collection) => {
      void queryClient.invalidateQueries({ queryKey: ["collections"] });
      navigate(`/sources/collections/${collection.id}`);
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ name: name.trim(), visibility });
  }

  return (
    <Card className="p-5">
      <form onSubmit={onSubmit} className="space-y-4">
        {create.isError && <Alert>{errorMessage(create.error)}</Alert>}
        <Input
          label="Collection name"
          placeholder="e.g. AI agent papers 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <fieldset className="space-y-2">
          <legend className="text-ink text-sm font-medium">Who can see it?</legend>
          {(
            [
              ["organization", "Everyone in the organization", !canShare],
              ["private", "Only me (and admins)", false],
            ] as const
          ).map(([value, label, disabled]) => (
            <label
              key={value}
              className="text-ink-muted flex items-center gap-2 text-sm has-disabled:opacity-50"
            >
              <input
                type="radio"
                name="visibility"
                value={value}
                checked={visibility === value}
                disabled={disabled}
                onChange={() => setVisibility(value)}
                className="accent-brand-600"
              />
              {label}
              {disabled && <span className="text-xs">(owners and admins only)</span>}
            </label>
          ))}
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending} disabled={name.trim().length < 2}>
            Create collection
          </Button>
        </div>
      </form>
    </Card>
  );
}
