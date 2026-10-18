import type { ClaimVerdict } from "@/types/api";

/**
 * How each verdict looks. Status colors never carry meaning alone: every verdict has an icon
 * and a label too (colorblind readers, print, forced-colors mode).
 */
export const VERDICT: Record<
  ClaimVerdict,
  { label: string; icon: string; badge: string; border: string }
> = {
  supported: {
    label: "Supported",
    icon: "✓",
    badge: "bg-emerald-50 text-emerald-800",
    border: "border-l-status-good",
  },
  partial: {
    label: "Partly supported",
    icon: "◐",
    badge: "bg-amber-50 text-amber-800",
    border: "border-l-status-warning",
  },
  unsupported: {
    label: "Unsupported",
    icon: "✕",
    badge: "bg-red-50 text-red-800",
    border: "border-l-status-critical",
  },
};

/** 0.875 → "88%"; null → "—". */
export function pct(value: number | null | undefined): string {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}
