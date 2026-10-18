import { useChartTooltip } from "./Tooltip";

/**
 * Horizontal bars, one series (one color for every bar: the categories have no order, so no
 * value ramp). Thin bars, 4px rounded data end, square at the baseline, value at the tip.
 */
export function BarList({
  items,
  format,
  color = "var(--color-viz-1)",
}: {
  items: Array<{ label: string; value: number; detail?: string }>;
  format: (value: number) => string;
  color?: string;
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip();
  const max = Math.max(...items.map((i) => i.value), 0) || 1;
  if (items.length === 0)
    return <p className="text-ink-muted py-6 text-center text-xs">No data in this period.</p>;

  return (
    <div ref={containerRef} className="relative space-y-2.5">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[minmax(0,40%)_minmax(0,1fr)] items-center gap-3"
        >
          <span className="text-ink-muted truncate text-xs" title={item.label}>
            {item.label}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`${item.label}: ${format(item.value)}`}
              onPointerEnter={(e) =>
                show(e.currentTarget, {
                  value: format(item.value),
                  label: item.label,
                  detail: item.detail,
                })
              }
              onPointerLeave={hide}
              onFocus={(e) =>
                show(e.currentTarget, {
                  value: format(item.value),
                  label: item.label,
                  detail: item.detail,
                })
              }
              onBlur={hide}
              // The hit area is the whole row height, bigger than the 12px bar.
              className="focus-visible:outline-brand-600 flex h-6 items-center rounded-r focus-visible:outline-2"
              style={{ width: `${Math.max((item.value / max) * 100, 1)}%` }}
            >
              <span
                className="block h-3 w-full rounded-r-[4px] transition-opacity hover:opacity-80"
                style={{ background: color }}
              />
            </button>
            <span className="text-ink shrink-0 text-xs tabular-nums">{format(item.value)}</span>
          </div>
        </div>
      ))}
      {tooltip}
    </div>
  );
}
