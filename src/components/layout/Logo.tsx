import { cn } from "@/components/ui/cn";

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className="inline-flex items-center gap-2">
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        className={cn("object-contain", size === "lg" ? "size-12" : "size-9")}
      />
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
