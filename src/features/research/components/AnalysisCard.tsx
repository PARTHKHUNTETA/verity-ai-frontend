import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import type { ToolCallRecord } from "@/types/api";
import { formatDuration } from "../format";

/** Code the agent ran in the sandbox during analysis, with what it returned. */
export function AnalysisCard({ toolCalls }: { toolCalls: ToolCallRecord[] }) {
  if (toolCalls.length === 0) return null;
  return (
    <Card>
      <h2 className="border-line text-ink border-b px-5 py-3 text-sm font-semibold">
        Analysis <span className="text-ink-muted font-normal">(code run in a sandbox)</span>
      </h2>
      <ul className="divide-line divide-y">
        {toolCalls.map((call) => (
          <li key={call.id} className="px-5 py-3">
            <details>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span className="text-ink text-sm">{call.args.purpose ?? call.tool}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    call.status === "succeeded"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700",
                  )}
                >
                  {call.status === "succeeded" ? "OK" : "Failed"}
                  {call.durationMs !== null && ` · ${formatDuration(call.durationMs)}`}
                </span>
              </summary>
              <div className="mt-3 space-y-2">
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                  <code>{call.args.code}</code>
                </pre>
                <pre className="bg-canvas text-ink overflow-x-auto rounded-lg p-3 text-xs">
                  {call.status === "succeeded"
                    ? JSON.stringify(call.result?.value, null, 2)
                    : call.error}
                </pre>
                {call.result?.logs && call.result.logs.length > 0 && (
                  <pre className="bg-canvas text-ink-muted overflow-x-auto rounded-lg p-3 text-xs">
                    {call.result.logs.join("\n")}
                  </pre>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </Card>
  );
}
