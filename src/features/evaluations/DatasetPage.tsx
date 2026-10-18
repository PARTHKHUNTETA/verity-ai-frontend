import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/auth-context";
import { errorMessage } from "@/services/api-client";
import { evalsApi } from "@/services/evals-api";
import type { EvalCase, EvalCaseCategory, EvalCaseInput } from "@/types/api";
import { CategoryBadge, EvalStatusBadge } from "./badges";
import { CATEGORY_LABELS, pct } from "./format";

/** One dataset: start an eval run on it, and edit its cases. */
export function DatasetPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const { can } = useAuth();
  const canManage = can("eval:manage");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dataset = useQuery({
    queryKey: ["evals", "dataset", datasetId],
    queryFn: () => evalsApi.getDataset(datasetId!),
  });
  const runs = useQuery({
    queryKey: ["evals", "runs", datasetId],
    queryFn: () => evalsApi.listRuns(datasetId),
  });
  const remove = useMutation({
    mutationFn: () => evalsApi.deleteDataset(datasetId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["evals"] });
      navigate("/evaluations");
    },
  });

  if (dataset.isPending) return <FullPageSpinner />;
  if (dataset.isError) return <Alert>{errorMessage(dataset.error)}</Alert>;
  const ds = dataset.data;

  return (
    <div className="space-y-6">
      <Link to="/evaluations" className="text-ink-muted hover:text-ink text-sm">
        ← Evaluations
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-ink font-mono text-xl font-semibold">{ds.name}</h1>
          {ds.description && <p className="text-ink-muted mt-1 text-sm">{ds.description}</p>}
          <p className="text-ink-subtle mt-1 text-xs">
            {ds.cases.length} cases
            {ds.collectionId && (
              <>
                {" · "}
                <Link to={`/sources/collections/${ds.collectionId}`} className="underline">
                  documents
                </Link>
              </>
            )}
          </p>
        </div>
        {canManage && (
          <Button
            variant="ghost"
            loading={remove.isPending}
            onClick={() => {
              if (confirm(`Delete the dataset "${ds.name}", its cases and its eval runs?`))
                remove.mutate();
            }}
          >
            Delete dataset
          </Button>
        )}
      </div>
      {remove.isError && <Alert>{errorMessage(remove.error)}</Alert>}

      {canManage && ds.cases.length > 0 && (
        <StartRunForm datasetId={ds.id} caseCount={ds.cases.length} />
      )}

      {runs.data && runs.data.length > 0 && (
        <Card>
          <h2 className="border-line text-ink border-b px-5 py-3 text-sm font-semibold">
            Eval runs
          </h2>
          <ul className="divide-line divide-y">
            {runs.data.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
              >
                <Link
                  to={`/evaluations/runs/${r.id}`}
                  className="text-ink hover:text-brand-600 truncate"
                >
                  {r.name}
                </Link>
                <span className="flex shrink-0 items-center gap-3">
                  {r.summary && (
                    <span className="text-ink-muted text-xs tabular-nums">
                      pass rate {pct(r.summary.passRate)}
                    </span>
                  )}
                  <EvalStatusBadge status={r.status} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <CasesCard datasetId={ds.id} cases={ds.cases} canManage={canManage} />
    </div>
  );
}

function StartRunForm({ datasetId, caseCount }: { datasetId: string; caseCount: number }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [topK, setTopK] = useState(4);
  const [revise, setRevise] = useState(true);
  const [discovery, setDiscovery] = useState(false);
  const [limit, setLimit] = useState("");
  const start = useMutation({
    mutationFn: () =>
      evalsApi.startRun({
        datasetId,
        name: name.trim() || `${revise ? "revise on" : "revise off"} · top ${topK}`,
        model: model.trim() || undefined,
        topK,
        revise,
        discovery,
        limit: limit ? Number(limit) : null,
      }),
    onSuccess: (run) => navigate(`/evaluations/runs/${run.id}`),
  });

  return (
    <Card className="p-5">
      <h2 className="text-ink text-sm font-semibold">Start an eval run</h2>
      <p className="text-ink-muted mt-0.5 text-xs">
        Runs every case through the agent with these settings, frozen at start. Runs are unattended:
        tool calls that would need approval are denied.
      </p>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          start.mutate();
        }}
      >
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. baseline"
        />
        <Input
          label="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="server default"
          hint="Used by the agent and the judges."
        />
        <Input
          label="Passages per sub-question (top K)"
          type="number"
          min={1}
          max={10}
          value={topK}
          onChange={(e) => setTopK(Number(e.target.value))}
        />
        <Input
          label="Only the first N cases"
          type="number"
          min={1}
          max={caseCount}
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder={`all ${caseCount}`}
        />
        <div className="space-y-2 sm:col-span-2">
          <label className="text-ink flex items-center gap-2 text-sm">
            <input type="checkbox" checked={revise} onChange={(e) => setRevise(e.target.checked)} />
            Revise weak reports once (the evaluation loop)
          </label>
          <label className="text-ink flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={discovery}
              onChange={(e) => setDiscovery(e.target.checked)}
            />
            Search the web and academic databases (uses search API credits)
          </label>
        </div>
        <div className="sm:col-span-2">
          {start.isError && (
            <div className="mb-3">
              <Alert>{errorMessage(start.error)}</Alert>
            </div>
          )}
          <Button type="submit" loading={start.isPending}>
            Start eval run
          </Button>
        </div>
      </form>
    </Card>
  );
}

const emptyCase: EvalCaseInput = {
  question: "",
  instructions: null,
  referenceAnswer: null,
  category: "normal",
  requiredPoints: [],
  expectedSources: [],
  forbiddenSources: [],
  forbiddenContent: [],
  tags: [],
};

function CasesCard({
  datasetId,
  cases,
  canManage,
}: {
  datasetId: string;
  cases: EvalCase[];
  canManage: boolean;
}) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  return (
    <Card>
      <div className="border-line flex items-center justify-between border-b px-5 py-3">
        <h2 className="text-ink text-sm font-semibold">Cases</h2>
        {canManage && editing !== "new" && (
          <Button variant="secondary" onClick={() => setEditing("new")}>
            Add case
          </Button>
        )}
      </div>
      {editing === "new" && (
        <CaseEditor datasetId={datasetId} initial={emptyCase} onDone={() => setEditing(null)} />
      )}
      {cases.length === 0 && editing !== "new" ? (
        <p className="text-ink-muted px-5 py-4 text-sm">No cases yet.</p>
      ) : (
        <ol className="divide-line divide-y">
          {cases.map((c) =>
            editing === c.id ? (
              <li key={c.id}>
                <CaseEditor
                  datasetId={datasetId}
                  caseId={c.id}
                  initial={c}
                  onDone={() => setEditing(null)}
                />
              </li>
            ) : (
              <li key={c.id} className="flex items-start gap-3 px-5 py-3">
                <span className="text-ink-subtle w-6 shrink-0 pt-0.5 text-xs tabular-nums">
                  {c.position}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-sm">{c.question}</p>
                  <div className="text-ink-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <CategoryBadge category={c.category} />
                    {c.requiredPoints.length > 0 && (
                      <span>{c.requiredPoints.length} required points</span>
                    )}
                    {c.expectedSources.length > 0 && (
                      <span>{c.expectedSources.length} expected sources</span>
                    )}
                    {c.forbiddenContent.length + c.forbiddenSources.length > 0 && (
                      <span>{c.forbiddenContent.length + c.forbiddenSources.length} forbidden</span>
                    )}
                  </div>
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs"
                    onClick={() => setEditing(c.id)}
                  >
                    Edit
                  </Button>
                )}
              </li>
            ),
          )}
        </ol>
      )}
    </Card>
  );
}

const toLines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

function CaseEditor({
  datasetId,
  caseId,
  initial,
  onDone,
}: {
  datasetId: string;
  caseId?: string;
  initial: EvalCaseInput;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    question: initial.question,
    instructions: initial.instructions ?? "",
    category: initial.category,
    requiredPoints: initial.requiredPoints.join("\n"),
    expectedSources: initial.expectedSources.join("\n"),
    forbiddenSources: initial.forbiddenSources.join("\n"),
    forbiddenContent: initial.forbiddenContent.join("\n"),
    tags: initial.tags.join(", "),
  });
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["evals"] });

  const save = useMutation({
    mutationFn: () => {
      const input: EvalCaseInput = {
        question: form.question.trim(),
        instructions: form.instructions.trim() || null,
        referenceAnswer: initial.referenceAnswer,
        category: form.category,
        requiredPoints: toLines(form.requiredPoints),
        expectedSources: toLines(form.expectedSources),
        forbiddenSources: toLines(form.forbiddenSources),
        forbiddenContent: toLines(form.forbiddenContent),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      return caseId
        ? evalsApi.updateCase(datasetId, caseId, input)
        : evalsApi.addCase(datasetId, input);
    },
    onSuccess: () => {
      void refresh();
      onDone();
    },
  });
  const remove = useMutation({
    mutationFn: () => evalsApi.deleteCase(datasetId, caseId!),
    onSuccess: () => {
      void refresh();
      onDone();
    },
  });

  return (
    <form
      className="bg-canvas/60 grid gap-3 px-5 py-4 sm:grid-cols-2"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div className="sm:col-span-2">
        <Textarea
          label="Question"
          value={form.question}
          onChange={set("question")}
          rows={2}
          required
        />
      </div>
      <Input
        label="Extra instructions"
        value={form.instructions}
        onChange={(e) => set("instructions")(e.target.value)}
      />
      <div className="space-y-1.5">
        <label htmlFor="case-category" className="text-ink block text-sm font-medium">
          Category
        </label>
        <select
          id="case-category"
          value={form.category}
          onChange={(e) => set("category")(e.target.value as EvalCaseCategory)}
          className="border-line bg-surface text-ink block w-full rounded-lg border px-3 py-2 text-sm"
        >
          {(Object.keys(CATEGORY_LABELS) as EvalCaseCategory[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <Textarea
        label="Required points (one per line)"
        hint="What a good answer must say. Checked by a judge model."
        value={form.requiredPoints}
        onChange={set("requiredPoints")}
      />
      <Textarea
        label="Expected sources (one per line)"
        hint="URL, DOI, domain or title the agent should find."
        value={form.expectedSources}
        onChange={set("expectedSources")}
      />
      <Textarea
        label="Forbidden sources (one per line)"
        hint="Domains or URLs that must never be cited."
        value={form.forbiddenSources}
        onChange={set("forbiddenSources")}
      />
      <Textarea
        label="Forbidden content (one per line)"
        hint="Text that must never appear, e.g. an injection payload."
        value={form.forbiddenContent}
        onChange={set("forbiddenContent")}
      />
      <Input
        label="Tags (comma separated)"
        value={form.tags}
        onChange={(e) => set("tags")(e.target.value)}
      />
      <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
        <Button type="submit" loading={save.isPending}>
          {caseId ? "Save case" : "Add case"}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        {caseId && (
          <Button
            variant="ghost"
            loading={remove.isPending}
            onClick={() => remove.mutate()}
            className="ml-auto"
          >
            Delete case
          </Button>
        )}
      </div>
      {(save.isError || remove.isError) && (
        <div className="sm:col-span-2">
          <Alert>{errorMessage(save.error ?? remove.error)}</Alert>
        </div>
      )}
    </form>
  );
}

function Textarea({
  label,
  hint,
  value,
  onChange,
  rows = 3,
  required,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
}) {
  const id = `ta-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-ink block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="border-line bg-surface text-ink focus:outline-brand-500 block w-full rounded-lg border px-3 py-2 text-sm focus:outline-2"
      />
      {hint && (
        <p id={`${id}-hint`} className="text-ink-muted text-xs">
          {hint}
        </p>
      )}
    </div>
  );
}
