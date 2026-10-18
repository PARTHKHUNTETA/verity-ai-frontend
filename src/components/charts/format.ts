/** Compact number: 1,284 → 1.3K, 12_900 → 12.9K, 4_200_000 → 4.2M. */
export function compact(n: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** Milliseconds for chart labels: 850 ms · 4.2 s · 2.5 min. */
export function ms(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value < 1000) return `${Math.round(value)} ms`;
  if (value < 60_000) return `${(value / 1000).toFixed(1)} s`;
  return `${(value / 60_000).toFixed(1)} min`;
}

export function usd(value: number | null | undefined): string {
  if (value == null) return "unknown";
  if (value === 0) return "$0";
  return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
}

/** A "nice" axis maximum (1, 2, 2.5 or 5 × a power of ten) at or above `max`. */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= max) ?? 10;
  return step * power;
}
