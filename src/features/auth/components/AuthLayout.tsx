import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/layout/Logo";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <Logo size="lg" />
        <p className="text-ink-muted mt-3 text-sm">
          Research with evidence. Answers with confidence.
        </p>
      </div>
      <Card className="w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-ink text-lg font-semibold">{title}</h1>
        <p className="text-ink-muted mt-1 mb-6 text-sm">{subtitle}</p>
        {children}
      </Card>
      <p className="text-ink-muted mt-6 text-sm">{footer}</p>
    </div>
  );
}
