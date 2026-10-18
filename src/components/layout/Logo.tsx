import { cn } from "@/components/ui/cn";

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className={cn(size === "lg" ? "size-9" : "size-7")}
      >
        <rect width="32" height="32" rx="8" className="fill-brand-700" />
        <path
          d="M9 10l7 13 7-13"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={cn(
          "text-ink font-semibold tracking-tight",
          size === "lg" ? "text-2xl" : "text-lg",
        )}
      >
        Verity<span className="text-brand-600">AI</span>
      </span>
    </span>
  );
}
