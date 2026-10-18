import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import type { JudgedClaim } from "@/types/api";
import { RatingButtons } from "./RatingButtons";
import { VERDICT } from "./verdict";

/**
 * Every cited sentence of the report with the fact-checker's verdict. The left border and badge
 * show the verdict; hovering (or tapping) the badge shows the judge's rationale. Readers can
 * disagree with a thumbs down: that feedback is how we find out where the judge is wrong.
 */
export function ClaimsCard({ reportId, claims }: { reportId: string; claims: JudgedClaim[] }) {
  const [onlyWeak, setOnlyWeak] = useState(false);
  if (!claims.length || !claims.some((c) => c.judgment)) return null;

  const count = (v: string) => claims.filter((c) => c.judgment?.verdict === v).length;
  const weak = claims.filter((c) => c.judgment && c.judgment.verdict !== "supported");
  const shown = onlyWeak ? weak : claims;
  const sections = [...new Set(shown.map((c) => c.section ?? ""))];

  return (
    <Card>
      <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
        <div>
          <h2 className="text-ink text-sm font-semibold">Claim check</h2>
          <p className="text-ink-muted mt-0.5 text-xs">
            {count("supported")} supported · {count("partial")} partly supported ·{" "}
            {count("unsupported")} unsupported
          </p>
        </div>
        <div
          role="group"
          aria-label="Show claims"
          className="border-line flex rounded-lg border p-0.5 text-xs"
        >
          {[
            { label: `All (${claims.length})`, value: false },
            { label: `Needs attention (${weak.length})`, value: true },
          ].map((f) => (
            <button
              key={f.label}
              type="button"
              aria-pressed={onlyWeak === f.value}
              onClick={() => setOnlyWeak(f.value)}
              className={cn(
                "rounded-md px-2.5 py-1",
                onlyWeak === f.value
                  ? "bg-canvas text-ink font-medium"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-ink-muted px-5 py-4 text-sm">
          Every claim is supported by its citations.
        </p>
      ) : (
        <div className="divide-line divide-y">
          {sections.map((section) => (
            <section key={section} className="px-5 py-3">
              {section && (
                <h3 className="text-ink-subtle mb-2 text-[11px] font-semibold tracking-wide uppercase">
                  {section}
                </h3>
              )}
              <ul className="space-y-2">
                {shown
                  .filter((c) => (c.section ?? "") === section)
                  .map((claim) => (
                    <ClaimRow key={claim.id} claim={claim} reportId={reportId} />
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Card>
  );
}

function ClaimRow({ claim, reportId }: { claim: JudgedClaim; reportId: string }) {
  const [pinned, setPinned] = useState(false);
  const j = claim.judgment;
  const v = j ? VERDICT[j.verdict] : null;
  const supports = new Map(j?.citations.map((c) => [c.number, c.supports]));

  return (
    <li
      className={cn(
        "border-line flex items-start gap-3 rounded-r-lg border-y border-r border-l-4 py-2 pr-2 pl-3",
        v?.border ?? "border-l-line",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-ink text-sm leading-relaxed">
          {claim.text}{" "}
          {claim.citations.map((n) => {
            const ok = supports.get(n);
            return (
              <span
                key={n}
                title={
                  ok === undefined
                    ? undefined
                    : ok
                      ? `Passage [${n}] supports this claim`
                      : `Passage [${n}] does not support this claim`
                }
                className={cn(
                  "mx-0.5 inline-flex h-4 items-center rounded px-1 align-super text-[10px] font-semibold",
                  ok === false
                    ? "bg-red-50 text-red-700 line-through"
                    : "bg-brand-100 text-brand-700",
                )}
              >
                {n}
              </span>
            );
          })}
        </p>
        {j && v && (
          <div className="group relative mt-1 inline-block">
            <button
              type="button"
              onClick={() => setPinned((p) => !p)}
              aria-expanded={pinned}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                v.badge,
              )}
            >
              <span aria-hidden="true">{v.icon}</span>
              {v.label}
            </button>
            {/* The rationale: a hover card on desktop, shown inline once tapped (touch, keyboard). */}
            {j.rationale &&
              (pinned ? (
                <p className="text-ink-muted mt-1 text-xs">{j.rationale}</p>
              ) : (
                <span
                  role="tooltip"
                  className="border-line bg-surface text-ink-muted pointer-events-none absolute top-full left-0 z-20 mt-1 hidden w-72 max-w-[80vw] rounded-lg border p-2.5 text-xs shadow-lg group-hover:block"
                >
                  {j.rationale}
                  <span className="text-ink-subtle mt-1 block">Judge: {j.judgeModel}</span>
                </span>
              ))}
          </div>
        )}
      </div>
      <RatingButtons
        reportId={reportId}
        claimId={claim.id}
        initial={claim.myRating}
        label={`claim ${claim.position}`}
      />
    </li>
  );
}
