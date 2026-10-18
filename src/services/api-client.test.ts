import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  apiRequest,
  hasAccessToken,
  refreshAccessToken,
  setAccessToken,
  setSessionExpiredHandler,
} from "./api-client";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const unauthorized = () => json(401, { error: { code: "UNAUTHORIZED", message: "Expired" } });
const session = (token: string) => json(200, { tokenType: "Bearer", accessToken: token });

const fetchMock = vi.fn<typeof fetch>();

/** Which URL and Authorization header each fetch call used. */
const calls = () =>
  fetchMock.mock.calls.map(([url, init]) => ({
    url: String(url),
    auth: (init?.headers as Record<string, string> | undefined)?.Authorization,
  }));

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  setAccessToken(null);
  setSessionExpiredHandler(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("sends the access token and parses JSON", async () => {
    setAccessToken("token-1");
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));

    await expect(apiRequest("/me")).resolves.toEqual({ ok: true });
    expect(calls()).toEqual([{ url: "/api/v1/me", auth: "Bearer token-1" }]);
  });

  it("refreshes on 401 and retries once with the new token", async () => {
    setAccessToken("expired");
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(session("fresh"))
      .mockResolvedValueOnce(json(200, { ok: true }));

    await expect(apiRequest("/me")).resolves.toEqual({ ok: true });
    expect(calls()).toEqual([
      { url: "/api/v1/me", auth: "Bearer expired" },
      { url: "/api/v1/auth/refresh", auth: undefined },
      { url: "/api/v1/me", auth: "Bearer fresh" },
    ]);
  });

  it("shares one refresh between concurrent requests", async () => {
    setAccessToken("expired");
    fetchMock.mockImplementation(async (url, init) => {
      if (String(url).endsWith("/auth/refresh")) return session("fresh");
      const auth = (init?.headers as Record<string, string>).Authorization;
      return auth === "Bearer fresh" ? json(200, { ok: true }) : unauthorized();
    });

    await Promise.all([apiRequest("/a"), apiRequest("/b"), apiRequest("/c")]);

    const refreshes = calls().filter((c) => c.url.endsWith("/auth/refresh"));
    expect(refreshes).toHaveLength(1);
  });

  it("reports an expired session when the refresh fails", async () => {
    setAccessToken("expired");
    const onExpired = vi.fn();
    setSessionExpiredHandler(onExpired);
    fetchMock.mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(unauthorized());

    await expect(apiRequest("/me")).rejects.toMatchObject({ status: 401 });
    expect(onExpired).toHaveBeenCalledOnce();
    expect(hasAccessToken()).toBe(false);
  });

  it("does not try to refresh for requests made without auth (e.g. a wrong password)", async () => {
    fetchMock.mockResolvedValueOnce(unauthorized());

    await expect(apiRequest("/auth/login", { method: "POST", auth: false })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("turns the backend error shape into an ApiError with field errors", async () => {
    fetchMock.mockResolvedValueOnce(
      json(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: [
            { path: "email", message: "Must be a valid email address" },
            { path: "password", message: "Too short" },
          ],
          requestId: "req-1",
        },
      }),
    );

    const err = await apiRequest("/auth/register", { method: "POST", body: {}, auth: false }).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).requestId).toBe("req-1");
    expect((err as ApiError).fieldErrors()).toEqual({
      email: "Must be a valid email address",
      password: "Too short",
    });
  });

  it("returns undefined for 204 No Content", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(
      apiRequest("/auth/logout", { method: "POST", auth: false }),
    ).resolves.toBeUndefined();
  });
});

describe("refreshAccessToken", () => {
  it("stores the new token on success and clears it on failure", async () => {
    fetchMock.mockResolvedValueOnce(session("fresh"));
    await expect(refreshAccessToken()).resolves.toBe(true);
    expect(hasAccessToken()).toBe(true);

    fetchMock.mockResolvedValueOnce(unauthorized());
    await expect(refreshAccessToken()).resolves.toBe(false);
    expect(hasAccessToken()).toBe(false);
  });
});
