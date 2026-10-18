import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessage } from "@/services/api-client";
import { approvalsApi } from "@/services/governance-api";
import type { ApprovalRequest } from "@/types/api";
import { formatRelativeTime } from "../research/format";

const LIMIT_LABELS = { maxSteps: "steps", maxTokens: "tokens", maxCostUsd: "USD" } as const;

/** Requests from paused research runs, for owners and admins (approval:decide). */
export function ApprovalsPage() {
  const pending = useQuery({
    queryKey: ["approvals", "pending"],
    queryFn: () => approvalsApi.list("pending"),
    refetchInterval: 15_000,
  });
  const all = useQuery({ queryKey: ["approvals", "all"], queryFn: () => approvalsApi.list("all") });
  const decided = (all.data ?? []).filter((a) => a.status !== "pending").slice(0, 20);

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Research runs pause here when your policy requires a human decision: running code, or spending more than the run's budget."
      />
      <div className="space-y-6">
        {pending.isPending && (
          <div className="text-brand-600 flex justify-center py-10">
            <Spinner />
          </div>
        )}
        {pending.isError && <Alert>{errorMessage(pending.error)}</Alert>}
        {pending.isSuccess && pending.data.length === 0 && (
          <Card className="text-ink-muted px-6 py-10 text-center text-sm">
            Nothing is waiting for approval.
          </Card>
        )}
        {pending.data?.map((approval) => (
          <PendingApproval key={approval.id} approval={approval} />
        ))}

        {decided.length > 0 && (
          <Card>
            <h2 className="border-line text-ink border-b px-5 py-3 text-sm font-semibold">
              Recently decided
            </h2>
            <ul className="divide-line divide-y">
              {decided.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-ink truncate text-sm">{a.summary}</p>
                    <p className="text-ink-muted truncate text-xs">
                      <Link to={`/research/runs/${a.runId}`} className="hover:text-ink">
                        {a.question}
                      </Link>
                      {a.comment && ` · “${a.comment}”`}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}

function PendingApproval({ approval }: { approval: ApprovalRequest }) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const isBudget = approval.kind === "budget";
  const [newLimit, setNewLimit] = useState(
    isBudget && approval.details.max ? String(approval.details.max * 2) : "",
  );

  const decide = useMutation({
    mutationFn: (decision: "approve" | "reject") =>
      approvalsApi.decide(approval.id, {
        decision,
        comment: comment.trim() || undefined,
        newLimit: isBudget && decision === "approve" && newLimit ? Number(newLimit) : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-amber-700 uppercase">
            {isBudget ? "More budget" : "Tool call"} · waiting{" "}
            {formatRelativeTime(approval.createdAt)}
          </p>
          <h2 className="text-ink mt-1 font-semibold">{approval.summary}</h2>
          <p className="text-ink-muted mt-1 text-sm">
            Run:{" "}
            <Link
              to={`/research/runs/${approval.runId}`}
              className="text-brand-600 hover:text-brand-700"
            >
              {approval.question}
            </Link>
            {approval.requestedByEmail && ` · started by ${approval.requestedByEmail}`}
          </p>
        </div>
      </div>

      {approval.details.reason && (
        <p className="text-ink-muted text-sm">Why: {approval.details.reason}</p>
      )}
      {approval.details.args?.code && (
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
          <code>{approval.details.args.code}</code>
        </pre>
      )}
      {isBudget && approval.details.limit && (
        <div className="flex flex-wrap items-end gap-4 text-sm">
          <p className="text-ink-muted">
            Used <span className="text-ink font-medium">{approval.details.used}</span> of{" "}
            <span className="text-ink font-medium">{approval.details.max}</span>{" "}
            {LIMIT_LABELS[approval.details.limit]}
          </p>
          <label className="text-ink-muted text-xs">
            New limit
            <input
              type="number"
              min={0}
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              className="border-line text-ink mt-1 block w-32 rounded-lg border px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      )}

      <textarea
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comment (optional): shown to the agent and in the audit log"
        aria-label="Comment"
        className="border-line placeholder:text-ink-subtle focus:outline-brand-500 block w-full rounded-lg border px-3 py-2 text-sm focus:outline-2"
      />
      {decide.isError && <Alert>{errorMessage(decide.error)}</Alert>}
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          loading={decide.isPending && decide.variables === "reject"}
          onClick={() => decide.mutate("reject")}
        >
          Reject
        </Button>
        <Button
          loading={decide.isPending && decide.variables === "approve"}
          onClick={() => decide.mutate("approve")}
        >
          Approve
        </Button>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: ApprovalRequest["status"] }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        status === "approved" && "bg-emerald-50 text-emerald-700",
        status === "rejected" && "bg-red-50 text-red-700",
        status === "expired" && "bg-slate-100 text-slate-600",
        status === "pending" && "bg-amber-50 text-amber-700",
      )}
    >
      {status}
    </span>
  );
}
