import { niceMax } from "./format";
import { useChartTooltip } from "./Tooltip";

/**
 * Columns over time, one series. ≤24px columns with 4px rounded caps, hairline solid gridlines,
 * clean y-axis ticks. Each column's whole slot is its hit target; the tooltip shows the value.
 */
export function ColumnChart({
  points,
  format,
  height = 160,
  color = "var(--color-viz-1)",
}: {
  points: Array<{ label: string; value: number; detail?: string }>;
  format: (value: number) => string;
  height?: number;
  color?: string;
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip();
  const top = niceMax(Math.max(...points.map((p) => p.value), 0));
  const ticks = [0, top / 2, top];
  // Show at most ~7 x labels so they never collide.
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));
  if (points.length === 0)
    return <p className="text-ink-muted py-6 text-center text-xs">No data in this period.</p>;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        {/* y-axis */}
        <div
          className="flex flex-col justify-between text-right text-[10px] text-[var(--color-viz-axis)] tabular-nums"
          style={{ height }}
        >
          {[...ticks].reverse().map((t) => (
            <span
              key={t}
              className="-translate-y-1/2 whitespace-nowrap first:translate-y-0 last:translate-y-0"
            >
              {format(t)}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {/* gridlines */}
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute inset-x-0 border-t border-[var(--color-viz-grid)]"
              style={{ bottom: `${(t / top) * height}px` }}
            />
          ))}
          <div className="relative flex items-end" style={{ height }}>
            {points.map((p) => (
              <button
                key={p.label}
                type="button"
                aria-label={`${p.label}: ${format(p.value)}`}
                onPointerEnter={(e) =>
                  show(e.currentTarget.firstElementChild ?? e.currentTarget, {
                    value: format(p.value),
                    label: p.label,
                    detail: p.detail,
                  })
                }
                onPointerLeave={hide}
                onFocus={(e) =>
                  show(e.currentTarget.firstElementChild ?? e.currentTarget, {
                    value: format(p.value),
                    label: p.label,
                    detail: p.detail,
                  })
                }
                onBlur={hide}
                className="group focus-visible:outline-brand-600 flex h-full flex-1 items-end justify-center focus-visible:outline-2"
              >
                <span
                  className="block w-full max-w-6 rounded-t-[4px] transition-opacity group-hover:opacity-80"
                  style={{
                    height: `${Math.max((p.value / top) * height, p.value > 0 ? 2 : 0)}px`,
                    background: color,
                  }}
                />
              </button>
            ))}
          </div>
          {/* x labels */}
          <div className="mt-1.5 flex text-[10px] text-[var(--color-viz-axis)]">
            {points.map((p, i) => (
              <span key={p.label} className="flex-1 text-center">
                {i % labelEvery === 0 ? p.label.slice(5) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      {tooltip}
    </div>
  );
}
