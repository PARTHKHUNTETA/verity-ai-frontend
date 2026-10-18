import { useState } from "react";
import { ApiError, errorMessage } from "@/services/api-client";

/**
 * Form submission state: pending flag, a general error message, and per-field errors
 * taken from the backend's 400 VALIDATION_ERROR response.
 */
export function useSubmit() {
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(action: () => Promise<void>) {
    setPending(true);
    setFormError(null);
    setFieldErrors({});
    try {
      await action();
    } catch (err) {
      const fields = err instanceof ApiError ? err.fieldErrors() : {};
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setFormError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return { pending, formError, fieldErrors, submit };
}
