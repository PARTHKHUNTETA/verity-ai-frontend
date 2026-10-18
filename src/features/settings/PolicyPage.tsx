import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { ApiError, errorMessage } from "@/services/api-client";
import { policiesApi } from "@/services/governance-api";
import type { PolicyRules } from "@/types/api";

/** The organization's agent policy (owners and admins: policy:manage). Saving creates a new version. */
export function PolicyPage() {
  const policy = useQuery({ queryKey: ["policy"], queryFn: policiesApi.active });
  // Kept here: the form remounts (fresh state) for each new version, which would lose a message.
  const [savedVersion, setSavedVersion] = useState<number | null>(null);
  if (policy.isPending) return <FullPageSpinner />;
  if (policy.isError) return <Alert>{errorMessage(policy.error)}</Alert>;
  return (
    <PolicyForm
      key={policy.data.version}
      version={policy.data.version}
      initial={policy.data.rules}
      justSaved={savedVersion === policy.data.version}
      onSaved={setSavedVersion}
    />
  );
}

function PolicyForm({
  version,
  initial,
  justSaved,
  onSaved,
}: {
  version: number;
  initial: PolicyRules;
  justSaved: boolean;
  onSaved: (version: number) => void;
}) {
  const queryClient = useQueryClient();
  const [rules, setRules] = useState(initial);
  const [blocked, setBlocked] = useState(initial.domains.blocked.join("\n"));
  const [allowed, setAllowed] = useState(initial.domains.allowed.join("\n"));
  const set = (patch: (r: PolicyRules) => void) =>
    setRules((current) => {
      const next = structuredClone(current);
      patch(next);
      return next;
    });

  const save = useMutation({
    mutationFn: () => {
      const lines = (text: string) =>
        text
          .split(/[\n,]/)
          .map((d) => d.trim())
          .filter(Boolean);
      return policiesApi.save({
        ...rules,
        domains: { blocked: lines(blocked), allowed: lines(allowed) },
      });
    },
    onSuccess: (saved) => {
      onSaved(saved.version);
      queryClient.setQueryData(["policy"], (old: object | undefined) => ({ ...old, ...saved }));
    },
  });
  const fieldErrors =
    save.error instanceof ApiError ? Object.entries(save.error.fieldErrors()) : [];

  return (
    <>
      <PageHeader
        title="Agent policy"
        description={`What VerityAI's agent may do in your organization. Every tool call is checked against these rules. Version ${version}.`}
        actions={
          <Button loading={save.isPending} onClick={() => save.mutate()}>
            Save as version {version + 1}
          </Button>
        }
      />
      <div className="space-y-6">
        {justSaved && (
          <Alert tone="info">Saved as version {version}. New tool calls follow this policy.</Alert>
        )}
        {save.isError && (
          <Alert>
            {fieldErrors.length
              ? fieldErrors.map(([path, message]) => `${path}: ${message}`).join(" · ")
              : errorMessage(save.error)}
          </Alert>
        )}

        <Section title="Tools" description="Disable a tool and the agent works without it.">
          <Toggle
            label="Web and academic search"
            checked={rules.tools.search.enabled}
            onChange={(v) => set((r) => (r.tools.search.enabled = v))}
          />
          <Toggle
            label="Fetch and read web pages / PDFs"
            checked={rules.tools.fetch.enabled}
            onChange={(v) => set((r) => (r.tools.fetch.enabled = v))}
          />
          <NumberField
            label="Max documents fetched per run"
            value={rules.tools.fetch.maxPerRun}
            onChange={(v) => set((r) => (r.tools.fetch.maxPerRun = v))}
          />
          <Toggle
            label="Search your collections (RAG)"
            checked={rules.tools.rag.enabled}
            onChange={(v) => set((r) => (r.tools.rag.enabled = v))}
          />
          <Toggle
            label="Run analysis code (sandboxed)"
            checked={rules.tools.run_code.enabled}
            onChange={(v) => set((r) => (r.tools.run_code.enabled = v))}
          />
          <Toggle
            label="Require approval before running code"
            checked={rules.tools.run_code.requireApproval}
            onChange={(v) => set((r) => (r.tools.run_code.requireApproval = v))}
          />
          <NumberField
            label="Max code runs per run"
            value={rules.tools.run_code.maxPerRun}
            onChange={(v) => set((r) => (r.tools.run_code.maxPerRun = v))}
          />
        </Section>

        <Section title="Domains" description="One domain per line; subdomains are included.">
          <DomainList
            label="Never fetch from"
            value={blocked}
            onChange={setBlocked}
            placeholder="spam.example"
          />
          <DomainList
            label="Only fetch from (leave empty to allow all other domains)"
            value={allowed}
            onChange={setAllowed}
            placeholder="arxiv.org"
          />
        </Section>

        <Section
          title="Budget per run"
          description="When a run reaches a limit, it either stops or waits for an admin's approval."
        >
          <NumberField
            label="Max cost (USD)"
            value={rules.budget.maxCostUsd}
            step={0.1}
            onChange={(v) => set((r) => (r.budget.maxCostUsd = v))}
          />
          <NumberField
            label="Max tokens"
            value={rules.budget.maxTokens}
            onChange={(v) => set((r) => (r.budget.maxTokens = v))}
          />
          <NumberField
            label="Max steps"
            value={rules.budget.maxSteps}
            onChange={(v) => set((r) => (r.budget.maxSteps = v))}
          />
          <label className="text-ink flex items-center justify-between gap-4 text-sm">
            When a limit is reached
            <select
              value={rules.budget.onExceed}
              onChange={(e) =>
                set(
                  (r) => (r.budget.onExceed = e.target.value as PolicyRules["budget"]["onExceed"]),
                )
              }
              className="border-line bg-surface rounded-lg border px-2 py-1.5 text-sm"
            >
              <option value="require_approval">Pause and ask an admin</option>
              <option value="fail">Stop the run</option>
            </select>
          </label>
        </Section>
      </div>
    </>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="border-line border-b px-5 py-3">
        <h2 className="text-ink text-sm font-semibold">{title}</h2>
        <p className="text-ink-muted text-xs">{description}</p>
      </div>
      <div className="space-y-4 px-5 py-4">{children}</div>
    </Card>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="text-ink flex items-center justify-between gap-4 text-sm">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-brand-600 size-4"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="text-ink flex items-center justify-between gap-4 text-sm">
      {label}
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border-line w-32 rounded-lg border px-2 py-1.5 text-right text-sm"
      />
    </label>
  );
}

function DomainList({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="text-ink block text-sm">
      {label}
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-line placeholder:text-ink-subtle mt-1 block w-full rounded-lg border px-3 py-2 font-mono text-xs"
      />
    </label>
  );
}
