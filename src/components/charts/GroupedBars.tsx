import { useChartTooltip } from "./Tooltip";

/**
 * Two series side by side per category, as horizontal bars on one shared 0–max axis (one axis,
 * never two scales). Series colors come in fixed order: series[0] → viz-1, series[1] → viz-2.
 * Bars are thin with a 2px gap between the pair; values are printed at the tips.
 */
export function GroupedBars({
  rows,
  series,
  format,
  max = 1,
}: {
  rows: Array<{ label: string; values: Array<number | null> }>;
  series: Array<{ label: string; color: string }>;
  format: (value: number) => string;
  max?: number;
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip();
  return (
    <div ref={containerRef} className="relative space-y-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[minmax(0,35%)_minmax(0,1fr)] items-center gap-3"
        >
          <span className="text-ink-muted truncate text-xs" title={row.label}>
            {row.label}
          </span>
          <div className="space-y-0.5">
            {series.map((s, i) => {
              const value = row.values[i] ?? null;
              const content = {
                value: value === null ? "not measured" : format(value),
                label: `${row.label} · ${s.label}`,
              };
              return (
                <div key={s.label} className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`${row.label}, ${s.label}: ${content.value}`}
                    onPointerEnter={(e) => show(e.currentTarget, content)}
                    onPointerLeave={hide}
                    onFocus={(e) => show(e.currentTarget, content)}
                    onBlur={hide}
                    className="focus-visible:outline-brand-600 relative flex h-3 flex-1 items-center focus-visible:outline-2"
                  >
                    {value !== null && (
                      <span
                        className="block h-2.5 rounded-r-[4px]"
                        style={{
                          width: `${Math.max(0.5, Math.min(100, (value / max) * 100))}%`,
                          background: s.color,
                        }}
                      />
                    )}
                  </button>
                  <span className="text-ink w-10 shrink-0 text-right text-[11px] tabular-nums">
                    {value === null ? "—" : format(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {tooltip}
    </div>
  );
}
