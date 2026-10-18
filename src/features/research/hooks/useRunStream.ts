import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useReducer, useState } from "react";
import { ApiError, errorMessage } from "@/services/api-client";
import { researchApi } from "@/services/research-api";
import { initialRunStreamState, runStreamReducer } from "../run-stream-state";

const MAX_RETRIES = 5;

/**
 * Follows a run live: opens the SSE stream, applies messages to state, and reconnects with
 * backoff if the connection drops (or a gap is detected) before the run is finished.
 */
export function useRunStream(runId: string) {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(runStreamReducer, initialRunStreamState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    // A copy of the state inside the effect, run through the same reducer, so the loop can
    // see a gap immediately (React state updates are only visible on the next render).
    let local = initialRunStreamState;

    (async () => {
      for (let attempt = 0; attempt <= MAX_RETRIES && !cancelled; attempt++) {
        if (attempt > 0) await sleep(Math.min(1000 * 2 ** (attempt - 1), 8000));
        try {
          for await (const message of researchApi.streamRun(runId, controller.signal)) {
            if (cancelled) return;
            local = runStreamReducer(local, message);
            dispatch(message);
            setError(null);
            attempt = 0; // connection is healthy again
            if (message.type === "done") {
              // The run finished: refresh the history list (status, cost, …).
              void queryClient.invalidateQueries({ queryKey: ["research", "tasks"] });
              return;
            }
            if (local.gap) break; // missed text: reconnect for a fresh snapshot
          }
        } catch (err) {
          if (cancelled || controller.signal.aborted) return;
          // 404/403 won't fix themselves by retrying.
          if (err instanceof ApiError && err.status < 500) {
            setError(errorMessage(err));
            return;
          }
          setError("Connection lost. Reconnecting…");
        }
      }
      if (!cancelled) setError("Couldn't reconnect to the live stream.");
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [runId, queryClient]);

  return { ...state, error };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
