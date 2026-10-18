import type { ReactNode } from "react";
import { Card } from "./Card";

/** Placeholder for features that are built in later phases. */
export function EmptyState({
  title,
  description,
  phase,
  icon,
}: {
  title: string;
  description: string;
  phase: string;
  icon: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <div className="bg-brand-50 text-brand-600 mb-4 flex size-12 items-center justify-center rounded-full">
        {icon}
      </div>
      <h2 className="text-ink text-base font-semibold">{title}</h2>
      <p className="text-ink-muted mt-1 max-w-md text-sm">{description}</p>
      <span className="bg-canvas text-ink-muted mt-4 rounded-full px-3 py-1 text-xs font-medium">
        Coming in {phase}
      </span>
    </Card>
  );
}
