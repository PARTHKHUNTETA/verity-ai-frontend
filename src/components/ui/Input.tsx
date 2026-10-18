import { useId, type InputHTMLAttributes } from "react";
import { cn } from "./cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

/** A labelled text input. Errors are linked with aria-describedby for screen readers. */
export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-ink block text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(
          "bg-surface text-ink placeholder:text-ink-subtle block w-full rounded-lg border px-3 py-2 text-sm",
          "focus:outline-brand-500 focus:outline-2 focus:outline-offset-0",
          error ? "border-red-400" : "border-line",
          className,
        )}
        {...props}
      />
      {message && (
        <p id={messageId} className={cn("text-xs", error ? "text-red-600" : "text-ink-muted")}>
          {message}
        </p>
      )}
    </div>
  );
}
