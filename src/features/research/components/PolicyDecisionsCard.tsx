import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import type { PolicyDecision } from "@/types/api";

const TOOL_LABELS: Record<string, string> = {
  search: "Search",
  fetch: "Fetch",
  rag: "Retrieve",
  run_code: "Run code",
};

function target(d: PolicyDecision): string {
  const args = d.args ?? {};
  return String(args.url ?? args.query ?? args.purpose ?? "");
}

/** Tool calls the policy gateway denied or sent for approval, with the rule and reason. */
export function PolicyDecisionsCard({ decisions }: { decisions: PolicyDecision[] }) {
  if (decisions.length === 0) return null;
  return (
    <Card>
      <h2 className="border-line text-ink border-b px-5 py-3 text-sm font-semibold">
        Policy decisions{" "}
        <span className="text-ink-muted font-normal">(denied or needing approval)</span>
      </h2>
      <ul className="divide-line divide-y">
        {decisions.map((d) => (
          <li key={d.id} className="flex items-start justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              <p className="text-ink text-sm">
                <span className="font-medium">{TOOL_LABELS[d.tool ?? ""] ?? d.tool}</span>
                {target(d) && <span className="text-ink-muted"> · {target(d)}</span>}
              </p>
              <p className="text-ink-muted text-xs">
                {d.reason}
                <span className="text-ink-subtle">
                  {" "}
                  · rule {d.matchedRule}
                  {d.policyVersion && `, policy v${d.policyVersion}`}
                </span>
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                d.decision === "deny" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700",
              )}
            >
              {d.decision === "deny" ? "Denied" : "Needs approval"}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
