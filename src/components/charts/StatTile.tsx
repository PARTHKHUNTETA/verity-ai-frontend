/** A headline number: label, value (proportional figures), optional sub-line. */
export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-line bg-surface rounded-xl border px-4 py-3">
      <p className="text-ink-muted text-xs">{label}</p>
      <p className="text-ink mt-1 text-xl font-semibold">{value}</p>
      {sub && <p className="text-ink-subtle mt-0.5 text-xs">{sub}</p>}
    </div>
  );
}
