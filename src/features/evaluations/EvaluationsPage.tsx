import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { BarList } from "@/components/charts/BarList";
import { ChartCard, DataTable } from "@/components/charts/ChartCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/auth-context";
import { errorMessage } from "@/services/api-client";
import { evalsApi } from "@/services/evals-api";
import type { EvalDataset, EvalRun } from "@/types/api";
import { EvalStatusBadge } from "./badges";
import { isLive, pct } from "./format";

/**
 * Offline evaluation home: datasets (benchmarks), and the scorecards dashboard of every eval
 * run. Pick two finished runs of the same dataset to compare them side by side.
 */
export function EvaluationsPage() {
  const { can } = useAuth();
  const datasets = useQuery({ queryKey: ["evals", "datasets"], queryFn: evalsApi.listDatasets });
  const runs = useQuery({
    queryKey: ["evals", "runs"],
    queryFn: () => evalsApi.listRuns(),
    refetchInterval: (q) => (q.state.data?.some((r) => isLive(r.status)) ? 3000 : false),
  });

  if (datasets.isPending || runs.isPending) return <FullPageSpinner />;
  if (datasets.isError) return <Alert>{errorMessage(datasets.error)}</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluations"
        description="Benchmark the agent on fixed datasets, then compare models, prompts and settings before shipping a change."
      />
      <DatasetsSection datasets={datasets.data} canManage={can("eval:manage")} />
      <RunsSection runs={runs.data ?? []} datasets={datasets.data} />
    </div>
  );
}

function DatasetsSection({ datasets, canManage }: { datasets: EvalDataset[]; canManage: boolean }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["evals", "datasets"] });
  const starter = useMutation({
    mutationFn: evalsApi.installStarter,
    onSuccess: (ds) => {
      void refresh();
      navigate(`/evaluations/datasets/${ds.id}`);
    },
  });
  const create = useMutation({
    mutationFn: () => evalsApi.createDataset({ name }),
    onSuccess: (ds) => {
      void refresh();
      navigate(`/evaluations/datasets/${ds.id}`);
    },
  });
  const hasStarter = datasets.some((d) => d.name === "ai-agents");

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-ink text-sm font-semibold">Datasets</h2>
        {canManage && (
          <div className="flex gap-2">
            {!hasStarter && (
              <Button
                variant="secondary"
                loading={starter.isPending}
                onClick={() => starter.mutate()}
              >
                Install starter dataset
              </Button>
            )}
            <Button variant="secondary" onClick={() => setCreating((c) => !c)}>
              New dataset
            </Button>
          </div>
        )}
      </div>
      {starter.isError && <Alert>{errorMessage(starter.error)}</Alert>}
      {creating && (
        <Card className="p-4">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <div className="min-w-56 flex-1">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. rag-questions"
                hint="Lowercase letters, numbers and dashes. The CLI uses it: npm run eval -- --dataset <name>"
                error={create.isError ? errorMessage(create.error) : undefined}
                required
              />
            </div>
            <Button type="submit" loading={create.isPending}>
              Create
            </Button>
          </form>
        </Card>
      )}
      {datasets.length === 0 ? (
        <Card className="text-ink-muted p-6 text-sm">
          No datasets yet. The starter dataset has 25 questions about AI agents, including 5
          prompt-injection attacks, with the documents they are written against.
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {datasets.map((d) => (
            <li key={d.id}>
              <Link
                to={`/evaluations/datasets/${d.id}`}
                className="border-line bg-surface hover:border-brand-500 block rounded-xl border p-4 shadow-sm"
              >
                <p className="text-ink font-mono text-sm font-semibold">{d.name}</p>
                {d.description && (
                  <p className="text-ink-muted mt-1 line-clamp-2 text-xs">{d.description}</p>
                )}
                <p className="text-ink-subtle mt-2 text-xs">{d.caseCount ?? 0} cases</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RunsSection({ runs, datasets }: { runs: EvalRun[]; datasets: EvalDataset[] }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const datasetName = new Map(datasets.map((d) => [d.id, d.name]));
  const finished = runs.filter((r) => r.summary);
  const chosen = runs.filter((r) => selected.includes(r.id));
  const comparable =
    chosen.length === 2 &&
    chosen[0]!.datasetId === chosen[1]!.datasetId &&
    chosen.every((r) => r.summary);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s.slice(-1), id]));

  if (!runs.length) {
    return (
      <section className="space-y-3">
        <h2 className="text-ink text-sm font-semibold">Eval runs</h2>
        <Card className="text-ink-muted p-6 text-sm">
          No eval runs yet. Open a dataset and start one.
        </Card>
      </section>
    );
  }

  // Oldest first, so the chart reads left to right in time order.
  const recent = [...finished].reverse().slice(-12);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-ink text-sm font-semibold">Eval runs</h2>
        <Button
          disabled={!comparable}
          onClick={() => {
            // A = the older run (baseline), B = the newer one.
            const [newer, older] = [...chosen].sort((x, y) =>
              y.createdAt.localeCompare(x.createdAt),
            );
            navigate(`/evaluations/compare?a=${older!.id}&b=${newer!.id}`);
          }}
        >
          Compare selected{selected.length ? ` (${selected.length})` : ""}
        </Button>
      </div>
      {selected.length === 2 && !comparable && (
        <p className="text-ink-muted text-xs">
          Pick two finished runs of the same dataset to compare them.
        </p>
      )}

      {recent.length > 0 && (
        <ChartCard
          title="Pass rate by eval run"
          description="Share of cases that passed every check, most recent last."
          table={
            <DataTable
              columns={["Eval run", "Dataset", "Pass rate", "Claim support"]}
              rows={recent.map((r) => [
                r.name,
                datasetName.get(r.datasetId) ?? "",
                pct(r.summary!.passRate),
                pct(r.summary!.means.claimSupport),
              ])}
            />
          }
        >
          <BarList
            items={recent.map((r) => ({
              label: r.name,
              value: r.summary!.passRate,
              detail: `${r.summary!.passed} of ${r.summary!.cases} cases · ${datasetName.get(r.datasetId) ?? ""}`,
            }))}
            format={(v) => pct(v)}
          />
        </ChartCard>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-line text-ink-muted border-b text-xs">
              <th className="w-10 py-2 pl-4">
                <span className="sr-only">Select</span>
              </th>
              <th className="py-2 pr-4 font-medium">Eval run</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 text-right font-medium">Pass rate</th>
              <th className="py-2 pr-4 text-right font-medium">Claim support</th>
              <th className="py-2 pr-4 text-right font-medium">Required points</th>
              <th className="py-2 pr-4 text-right font-medium">Red team</th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {runs.map((r) => {
              const red = r.summary?.byCategory.red_team;
              return (
                <tr key={r.id}>
                  <td className="py-2.5 pl-4">
                    <input
                      type="checkbox"
                      aria-label={`Select ${r.name} for comparison`}
                      checked={selected.includes(r.id)}
                      disabled={!r.summary}
                      onChange={() => toggle(r.id)}
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    <Link
                      to={`/evaluations/runs/${r.id}`}
                      className="text-ink hover:text-brand-600 font-medium"
                    >
                      {r.name}
                    </Link>
                    <p className="text-ink-subtle text-xs">
                      {datasetName.get(r.datasetId) ?? "deleted dataset"} · {r.config.model}
                      {r.config.revise ? "" : " · no revision"} · top {r.config.topK}
                    </p>
                  </td>
                  <td className="py-2.5 pr-4">
                    <EvalStatusBadge status={r.status} />
                  </td>
                  <td className="text-ink py-2.5 pr-4 text-right tabular-nums">
                    {r.summary ? pct(r.summary.passRate) : "—"}
                  </td>
                  <td className="text-ink py-2.5 pr-4 text-right tabular-nums">
                    {pct(r.summary?.means.claimSupport)}
                  </td>
                  <td className="text-ink py-2.5 pr-4 text-right tabular-nums">
                    {pct(r.summary?.means.requiredPoints)}
                  </td>
                  <td className="text-ink py-2.5 pr-4 text-right tabular-nums">
                    {red ? `${red.passed}/${red.cases}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
