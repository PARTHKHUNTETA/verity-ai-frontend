import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/auth-context";
import { ApiError, errorMessage } from "@/services/api-client";
import { researchApi } from "@/services/research-api";

const EXAMPLES = [
  "Research the latest developments in AI agents, compare the major approaches, and identify gaps.",
  "How do retrieval-augmented generation systems reduce hallucinations, and where do they fail?",
];

export function NewResearchForm() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");
  const [discover, setDiscover] = useState(true);
  const capabilities = useQuery({
    queryKey: ["research", "capabilities"],
    queryFn: researchApi.capabilities,
    staleTime: Infinity,
  });

  const create = useMutation({
    mutationFn: researchApi.createTask,
    onSuccess: ({ run }) => {
      void queryClient.invalidateQueries({ queryKey: ["research", "tasks"] });
      navigate(`/research/runs/${run.id}`);
    },
  });

  if (!can("run:create")) {
    return (
      <Alert tone="info">
        Your role can view research but not start new runs. Ask an admin for the researcher role.
      </Alert>
    );
  }

  const fieldError =
    create.error instanceof ApiError ? create.error.fieldErrors().question : undefined;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ question: question.trim(), discover });
  }

  return (
    <Card className="p-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <label htmlFor="question" className="text-ink block text-sm font-medium">
          Research question
        </label>
        <textarea
          id="question"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit(e);
          }}
          placeholder="What do you want to investigate?"
          className="border-line bg-surface text-ink placeholder:text-ink-subtle focus:outline-brand-500 block w-full resize-y rounded-lg border px-3 py-2 text-sm focus:outline-2"
          aria-invalid={fieldError ? true : undefined}
        />
        {fieldError && <p className="text-xs text-red-600">{fieldError}</p>}
        <DiscoveryToggle checked={discover} onChange={setDiscover} providers={capabilities.data} />
        {create.isError && !fieldError && <Alert>{errorMessage(create.error)}</Alert>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuestion(example)}
                className="border-line text-ink-muted hover:bg-canvas hover:text-ink max-w-xs truncate rounded-full border px-3 py-1 text-xs"
                title={example}
              >
                {example}
              </button>
            ))}
          </div>
          <Button type="submit" loading={create.isPending} disabled={question.trim().length < 10}>
            Start research
          </Button>
        </div>
      </form>
    </Card>
  );
}

const PROVIDER_LABELS: Record<string, string> = {
  tavily: "the web",
  arxiv: "arXiv",
  semantic_scholar: "Semantic Scholar",
};

function DiscoveryToggle({
  checked,
  onChange,
  providers,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  providers?: { webSearch: string | null; academicSearch: string[] };
}) {
  const names = [
    ...(providers?.webSearch ? [providers.webSearch] : []),
    ...(providers?.academicSearch ?? []),
  ].map((p) => PROVIDER_LABELS[p] ?? p);
  const disabled = providers !== undefined && names.length === 0;

  return (
    <label className="text-ink-muted flex items-start gap-2 text-sm has-disabled:opacity-60">
      <input
        type="checkbox"
        checked={checked && !disabled}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-brand-600 mt-0.5"
      />
      <span>
        Find new sources on {names.length ? names.join(", ") : "the web"}
        <span className="text-ink-subtle block text-xs">
          {disabled
            ? "No search providers are configured on the server."
            : "Up to 5 documents are fetched, read and indexed, then cited alongside your own collections."}
        </span>
      </span>
    </label>
  );
}
