import { cn } from "./cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent",
        className,
      )}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="text-brand-600 flex h-full items-center justify-center">
      <Spinner className="size-6" />
    </div>
  );
}
