import { createContext, useContext } from "react";
import type { LoginInput, RegisterInput } from "@/services/auth-api";
import type { Action, Me } from "@/types/api";

export type AuthState =
  | { status: "loading" } // checking for an existing session on page load
  | { status: "anonymous" }
  | { status: "authenticated"; me: Me };

export type AuthContextValue = {
  state: AuthState;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-reads /me, e.g. after the user's role changed. */
  reloadMe: () => Promise<void>;
  /**
   * UX only: hide or disable things the user can't do. The backend checks every request
   * anyway, so this is never a security boundary.
   */
  can: (action: Action) => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/** For components that only render when signed in (inside <ProtectedRoute>). */
export function useMe(): Me {
  const { state } = useAuth();
  if (state.status !== "authenticated") throw new Error("useMe used outside a protected route");
  return state.me;
}
