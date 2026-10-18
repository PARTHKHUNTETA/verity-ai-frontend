import type { RunDetail } from "@/types/api";
import type { RunStreamMessage } from "@/services/research-api";

/**
 * Pure state logic for a live run, kept separate from React so it is easy to test.
 *
 * The answer arrives as deltas with an `offset` (where the text starts). That makes updates
 * idempotent: a delta we already have (e.g. after a reconnect) is skipped, and a gap
 * (we missed something) is detected so the hook can reconnect and get a fresh snapshot.
 */
export type RunStreamState = {
  detail: RunDetail | null;
  /** The answer text as currently known (may be ahead of detail.report while streaming). */
  content: string;
  /** True once the server said "done" (the run is finished and the stream closed). */
  finished: boolean;
  /** Set when a delta arrived past the end of our text: we need a fresh snapshot. */
  gap: boolean;
  /** Which report version `content` is (the evaluation stage may write a version 2). */
  version: number;
};

export const initialRunStreamState: RunStreamState = {
  detail: null,
  content: "",
  finished: false,
  gap: false,
  version: 1,
};

export function runStreamReducer(state: RunStreamState, message: RunStreamMessage): RunStreamState {
  switch (message.type) {
    case "snapshot": {
      const { detail } = message;
      const saved = detail.report?.contentMd ?? "";
      const isFinal = detail.report?.status === "final";
      const version = detail.report?.version ?? state.version;
      // The DB copy is saved about once a second, so while streaming it can lag behind what
      // we already received live. Keep ours if it extends the saved copy of the same version.
      const content =
        version === state.version &&
        !isFinal &&
        state.content.length > saved.length &&
        state.content.startsWith(saved)
          ? state.content
          : saved;
      return { ...state, detail, content, version, gap: false };
    }

    case "status":
      if (!state.detail) return state;
      return {
        ...state,
        detail: {
          ...state.detail,
          run: { ...state.detail.run, status: message.status, stage: message.stage },
        },
      };

    case "delta": {
      if (message.version < state.version) return state; // an older draft
      if (message.version > state.version) {
        // A revision started: it replaces the text from the beginning.
        if (message.offset > 0)
          return { ...state, version: message.version, content: "", gap: true };
        return { ...state, version: message.version, content: message.text };
      }
      const end = message.offset + message.text.length;
      if (end <= state.content.length) return state; // already have it
      if (message.offset > state.content.length) return { ...state, gap: true };
      // Append only the part we don't have yet (handles overlap after a reconnect).
      const fresh = message.text.slice(state.content.length - message.offset);
      return { ...state, content: state.content + fresh };
    }

    case "done":
      return { ...state, finished: true };
  }
}
