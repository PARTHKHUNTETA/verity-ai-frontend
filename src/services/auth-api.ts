import type { Me, SessionResponse } from "@/types/api";
import { apiRequest, setAccessToken } from "./api-client";

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
  organizationName: string;
};

export type LoginInput = { email: string; password: string; organizationId?: string };

/** Register and login both start a session: keep the access token, the cookie is set by the server. */
async function startSession(path: string, body: unknown): Promise<SessionResponse> {
  const session = await apiRequest<SessionResponse>(path, { method: "POST", body, auth: false });
  setAccessToken(session.accessToken);
  return session;
}

export const authApi = {
  register: (input: RegisterInput) => startSession("/auth/register", input),
  login: (input: LoginInput) => startSession("/auth/login", input),

  async logout(): Promise<void> {
    try {
      await apiRequest<void>("/auth/logout", { method: "POST", auth: false });
    } finally {
      setAccessToken(null);
    }
  },

  me: () => apiRequest<Me>("/me"),
};
