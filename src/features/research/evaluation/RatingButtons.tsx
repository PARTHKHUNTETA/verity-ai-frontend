import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/components/ui/cn";
import { ThumbDownIcon, ThumbUpIcon } from "@/components/ui/icons";
import { errorMessage } from "@/services/api-client";
import { researchApi } from "@/services/research-api";

type Rating = -1 | 1 | null;

/**
 * Thumbs up/down on a report or a single claim. Clicking the active thumb again clears it.
 * The change shows immediately and is undone if saving fails.
 */
export function RatingButtons({
  reportId,
  claimId,
  initial,
  label,
}: {
  reportId: string;
  claimId?: string;
  initial: Rating;
  /** What is being rated, for screen readers ("this claim", "this report"). */
  label: string;
}) {
  const [rating, setRating] = useState<Rating>(initial);
  const save = useMutation({
    mutationFn: (next: -1 | 0 | 1) => researchApi.rateReport({ reportId, claimId, rating: next }),
  });

  const choose = (value: -1 | 1) => {
    const previous = rating;
    const next = rating === value ? null : value;
    setRating(next);
    save.mutate(next ?? 0, { onError: () => setRating(previous) });
  };

  const button = (value: -1 | 1) => {
    const active = rating === value;
    return (
      <button
        type="button"
        onClick={() => choose(value)}
        aria-pressed={active}
        aria-label={`${value === 1 ? "Helpful" : "Not helpful"}: ${label}`}
        title={value === 1 ? "Looks right" : "Looks wrong"}
        className={cn(
          "rounded-md p-1 transition-colors",
          active
            ? value === 1
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
            : "text-ink-subtle hover:bg-canvas hover:text-ink",
        )}
      >
        {value === 1 ? <ThumbUpIcon filled={active} /> : <ThumbDownIcon filled={active} />}
      </button>
    );
  };

  return (
    <span className="inline-flex items-center gap-0.5">
      {button(1)}
      {button(-1)}
      {save.isError && (
        <span role="alert" className="ml-1 text-xs text-red-700">
          {errorMessage(save.error)}
        </span>
      )}
    </span>
  );
}
