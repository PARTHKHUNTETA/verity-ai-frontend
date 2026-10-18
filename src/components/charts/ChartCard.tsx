import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";

/**
 * A chart with a title and a Chart / Table switch. The table view is the accessible twin of the
 * chart (every value without hovering, no reliance on color).
 */
export function ChartCard({
  title,
  description,
  legend,
  table,
  children,
  className,
}: {
  title: string;
  description?: string;
  legend?: ReactNode;
  table: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <Card className={cn("p-5", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-ink text-sm font-semibold">{title}</h3>
          {description && <p className="text-ink-muted mt-0.5 text-xs">{description}</p>}
        </div>
        <div
          role="tablist"
          aria-label={`${title} view`}
          className="border-line flex rounded-lg border p-0.5 text-xs"
        >
          {(["chart", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-2.5 py-1 capitalize",
                view === v ? "bg-canvas text-ink font-medium" : "text-ink-muted hover:text-ink",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      {view === "chart" && legend && <div className="mb-3">{legend}</div>}
      {view === "chart" ? children : table}
    </Card>
  );
}

export function Legend({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <ul className="text-ink-muted flex flex-wrap gap-4 text-xs">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-line text-ink-muted border-b">
            {columns.map((c, i) => (
              <th key={c} className={cn("py-2 pr-4 font-medium", i > 0 && "text-right")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((row, r) => (
            <tr key={r} className="border-line border-b last:border-0">
              {row.map((cell, i) => (
                <td key={i} className={cn("text-ink py-2 pr-4", i > 0 && "text-right")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
