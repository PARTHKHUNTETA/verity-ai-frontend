import { Link } from "react-router";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { FEATURES, PIPELINE, ROLES, type GuideFeature } from "./guide-content";

/**
 * "How VerityAI works": every feature with an example, how it is processed, and what you get.
 * Static content (guide-content.ts), so it loads instantly and works for every role.
 */
export function GuidePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="How VerityAI works"
        description="Everything you can do, with an example, what happens behind the scenes, and what you get back."
      />

      <nav aria-label="Guide contents">
        <ul className="flex flex-wrap gap-2">
          {[
            { id: "pipeline", title: "From question to report" },
            ...FEATURES,
            { id: "roles", title: "Who can do what" },
          ].map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="border-line bg-surface text-ink-muted hover:border-brand-500 hover:text-ink inline-block rounded-full border px-3 py-1 text-xs"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="pipeline" className="scroll-mt-6">
        <Card className="p-5 sm:p-6">
          <h2 className="text-ink text-base font-semibold">From question to report</h2>
          <p className="text-ink-muted mt-1 text-sm">
            A research run moves through these stages. Each one is saved, so a run can pause for an
            approval or survive a restart and continue where it stopped. Every stage is traced, and
            every tool call passes the agent policy first.
          </p>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PIPELINE.map((stage, i) => (
              <li key={stage.name} className="border-line rounded-lg border px-3 py-2.5">
                <p className="text-ink text-sm font-semibold">
                  <span className="text-brand-600 mr-1.5 tabular-nums">{i + 1}</span>
                  {stage.name}
                </p>
                <p className="text-ink-muted mt-0.5 text-xs">{stage.detail}</p>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      {FEATURES.map((feature) => (
        <FeatureSection key={feature.id} feature={feature} />
      ))}

      <section id="roles" className="scroll-mt-6">
        <Card className="overflow-x-auto">
          <h2 className="border-line text-ink border-b px-5 py-3 text-base font-semibold">
            Who can do what
          </h2>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-line text-ink-muted border-b text-xs">
                <th className="px-5 py-2 font-medium">Action</th>
                {["Owner", "Admin", "Researcher", "Viewer"].map((r) => (
                  <th key={r} className="px-3 py-2 text-center font-medium">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {ROLES.map((row) => (
                <tr key={row.action}>
                  <td className="text-ink px-5 py-2.5">{row.action}</td>
                  {[row.owner, row.admin, row.researcher, row.viewer].map((allowed, i) => (
                    <td key={i} className="px-3 py-2.5 text-center">
                      <span
                        aria-hidden="true"
                        className={allowed ? "text-status-good" : "text-ink-subtle"}
                      >
                        {allowed ? "✓" : "—"}
                      </span>
                      <span className="sr-only">{allowed ? "Yes" : "No"}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}

function FeatureSection({ feature }: { feature: GuideFeature }) {
  return (
    <section id={feature.id} className="scroll-mt-6">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-ink text-base font-semibold">{feature.title}</h2>
            <p className="text-ink-muted mt-1 text-sm">{feature.summary}</p>
          </div>
          <Link
            to={feature.link.to}
            className="text-brand-600 hover:text-brand-700 shrink-0 text-sm font-medium"
          >
            Open {feature.link.label} →
          </Link>
        </div>
        <p className="text-ink-subtle mt-2 text-xs">Who: {feature.who}</p>

        <div className="bg-canvas border-line mt-4 rounded-lg border px-4 py-3">
          <p className="text-ink-muted text-xs font-medium tracking-wide uppercase">
            Example · {feature.example.label}
          </p>
          <p className="text-ink mt-1 text-sm">{feature.example.text}</p>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div>
            <h3 className="text-ink text-sm font-semibold">How it's processed</h3>
            <ol className="mt-3 space-y-3">
              {feature.steps.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="bg-brand-50 text-brand-700 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-ink text-sm font-medium">{step.title}</p>
                    <p className="text-ink-muted mt-0.5 text-sm">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="text-ink text-sm font-semibold">What you get</h3>
            <ul className="mt-3 space-y-2">
              {feature.result.map((r) => (
                <li key={r} className="text-ink-muted flex gap-2 text-sm">
                  <span aria-hidden="true" className="text-status-good shrink-0">
                    ✓
                  </span>
                  {r}
                </li>
              ))}
            </ul>
            {feature.tip && (
              <p className="border-brand-200 text-ink-muted mt-4 border-l-2 pl-3 text-xs">
                <span className="text-ink font-medium">Tip: </span>
                {feature.tip}
              </p>
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}
