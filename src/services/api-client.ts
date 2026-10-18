import type { ApiErrorBody, SessionResponse } from "@/types/api";

/**
 * The only place that talks HTTP to the backend.
 *
 * Token handling (docs/system-design.md §7):
 * - The access token lives in memory only (this module), never in localStorage, so XSS can't
 *   read it from storage. A page reload loses it; `refreshAccessToken()` gets a new one using
 *   the httpOnly refresh cookie, which JavaScript can't see at all.
 * - On a 401, the client refreshes once and retries the request once.
 * - Only one refresh runs at a time. The backend rotates refresh tokens and treats a reused
 *   token as theft, so two parallel refreshes with the same cookie would log the user out.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Field errors from a 400 VALIDATION_ERROR, keyed by field path: { email: "..." }. */
  fieldErrors(): Record<string, string> {
    if (!Array.isArray(this.details)) return {};
    const result: Record<string, string> = {};
    for (const d of this.details as Array<{ path?: unknown; message?: unknown }>) {
      if (typeof d.path === "string" && typeof d.message === "string" && !result[d.path]) {
        result[d.path] = d.message;
      }
    }
    return result;
  }
}

// --- Access token (memory only) ---------------------------------------------------------

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function hasAccessToken(): boolean {
  return accessToken !== null;
}

/** Called when the session can't be renewed, so the app can send the user to the login page. */
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

// --- Refresh (single-flight) -----------------------------------------------------------

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Gets a new access token using the refresh cookie. Returns false if there is no valid session.
 * Concurrent callers share one request. Across browser tabs, the Web Locks API makes tabs take
 * turns, so each refresh sends the newest cookie (the cookie jar is shared between tabs).
 */
export function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= runRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function runRefresh(): Promise<boolean> {
  const doRefresh = async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) {
        setAccessToken(null);
        return false;
      }
      const session = (await res.json()) as SessionResponse;
      setAccessToken(session.accessToken);
      return true;
    } catch {
      // Network error: keep whatever token we have and report failure.
      return false;
    }
  };
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  return locks ? locks.request("verity-auth-refresh", doRefresh) : doRefresh();
}

// --- Requests --------------------------------------------------------------------------

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Send the access token (default true). Auth endpoints like /auth/login set this to false. */
  auth?: boolean;
  signal?: AbortSignal;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true } = options;
  let res = await send(path, options, auth);

  if (res.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await send(path, options, auth);
    } else {
      onSessionExpired?.();
    }
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Opens a streaming response (e.g. Server-Sent Events) with the same auth handling as
 * apiRequest. The browser's EventSource can't send an Authorization header, so streams use
 * fetch and read the body incrementally instead.
 */
export async function openStream(path: string, signal?: AbortSignal): Promise<Response> {
  const options: RequestOptions = { signal };
  let res = await send(path, options, true, "text/event-stream");
  if (res.status === 401) {
    if (await refreshAccessToken()) res = await send(path, options, true, "text/event-stream");
    else onSessionExpired?.();
  }
  if (!res.ok || !res.body) throw await toApiError(res);
  return res;
}

/**
 * Downloads a file from the API (with the same auth handling) and saves it in the browser
 * under the server's file name.
 */
export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  let res = await send(path, {}, true, "*/*");
  if (res.status === 401) {
    if (await refreshAccessToken()) res = await send(path, {}, true, "*/*");
    else onSessionExpired?.();
  }
  if (!res.ok) throw await toApiError(res);
  const name =
    res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function send(
  path: string,
  { method = "GET", body, signal }: RequestOptions,
  auth: boolean,
  accept = "application/json",
) {
  const headers: Record<string, string> = { Accept: accept };
  // FormData (file uploads) sets its own multipart Content-Type with a boundary.
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  return fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    credentials: "same-origin",
    signal,
  });
}

async function toApiError(res: Response): Promise<ApiError> {
  try {
    const { error } = (await res.json()) as ApiErrorBody;
    return new ApiError(res.status, error.code, error.message, error.details, error.requestId);
  } catch {
    return new ApiError(res.status, "UNKNOWN_ERROR", `Request failed with status ${res.status}`);
  }
}

/** A user-facing message for any thrown value. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError) return "Can't reach the server. Check your connection.";
  return "Something went wrong. Please try again.";
}
