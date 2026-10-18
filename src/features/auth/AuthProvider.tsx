import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { refreshAccessToken, setSessionExpiredHandler } from "@/services/api-client";
import { authApi, type LoginInput, type RegisterInput } from "@/services/auth-api";
import type { Action } from "@/types/api";
import { AuthContext, type AuthContextValue, type AuthState } from "./auth-context";

/**
 * Owns "who is signed in" for the whole app.
 *
 * Page load: the access token is gone (it was only in memory), so we try a refresh with the
 * httpOnly cookie. If it works, the user stays signed in; if not, they are anonymous.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const signOutLocally = useCallback(() => {
    queryClient.clear(); // drop cached data from the previous user/organization
    setState({ status: "anonymous" });
  }, [queryClient]);

  // Restore an existing session once on page load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        if (!cancelled) setState({ status: "anonymous" });
        return;
      }
      try {
        const me = await authApi.me();
        if (!cancelled) setState({ status: "authenticated", me });
      } catch {
        if (!cancelled) setState({ status: "anonymous" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // If any request finds the session can't be renewed, sign out locally.
  useEffect(() => {
    setSessionExpiredHandler(signOutLocally);
    return () => setSessionExpiredHandler(null);
  }, [signOutLocally]);

  const startSession = useCallback(
    async (start: () => Promise<unknown>) => {
      await start();
      queryClient.clear();
      setState({ status: "authenticated", me: await authApi.me() });
    },
    [queryClient],
  );

  const login = useCallback(
    (input: LoginInput) => startSession(() => authApi.login(input)),
    [startSession],
  );
  const register = useCallback(
    (input: RegisterInput) => startSession(() => authApi.register(input)),
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      signOutLocally();
    }
  }, [signOutLocally]);

  const reloadMe = useCallback(async () => {
    const me = await authApi.me();
    setState({ status: "authenticated", me });
  }, []);

  const can = useCallback(
    (action: Action) => state.status === "authenticated" && state.me.permissions.includes(action),
    [state],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ state, login, register, logout, reloadMe, can }),
    [state, login, register, logout, reloadMe, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
