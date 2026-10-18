import { useCallback, useRef, useState, type ReactNode, type RefObject } from "react";

/**
 * One tooltip per chart, anchored above the hovered/focused mark. Tooltips enhance and never
 * gate: every value is also in the chart's table view. Content is rendered as React text
 * (never innerHTML), because labels come from data.
 */
export type TooltipContent = { value: string; label: string; detail?: string };

export function useChartTooltip(): {
  containerRef: RefObject<HTMLDivElement | null>;
  tooltip: ReactNode;
  show: (target: Element, content: TooltipContent) => void;
  hide: () => void;
} {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ x: number; y: number; content: TooltipContent } | null>(
    null,
  );

  const show = useCallback((target: Element, content: TooltipContent) => {
    const container = containerRef.current?.getBoundingClientRect();
    const mark = target.getBoundingClientRect();
    if (!container) return;
    setState({
      x: mark.left + mark.width / 2 - container.left,
      y: mark.top - container.top,
      content,
    });
  }, []);
  const hide = useCallback(() => setState(null), []);

  const tooltip = state ? (
    <div
      role="tooltip"
      className="border-line bg-surface pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{ left: state.x, top: state.y - 6 }}
    >
      {/* Values lead, labels follow. */}
      <p className="text-ink font-semibold">{state.content.value}</p>
      <p className="text-ink-muted">{state.content.label}</p>
      {state.content.detail && (
        <p className="text-ink-subtle mt-0.5 max-w-64 truncate">{state.content.detail}</p>
      )}
    </div>
  ) : null;

  return { containerRef, tooltip, show, hide };
}
