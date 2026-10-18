import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router";
import { AuthContext, type AuthContextValue, type AuthState } from "@/features/auth/auth-context";
import type { Me } from "@/types/api";

export const testMe: Me = {
  user: { id: "u1", email: "ada@example.com", name: "Ada Lovelace", lastLoginAt: null },
  organization: { id: "o1", name: "Ada Labs", slug: "ada-labs" },
  role: "owner",
  permissions: ["report:read", "member:read", "member:manage"],
  memberships: [{ organizationId: "o1", name: "Ada Labs", slug: "ada-labs", role: "owner" }],
};

/** Renders routes with a fake auth context, so components can be tested without a backend. */
export function renderWithAuth(
  routes: RouteObject[],
  {
    state,
    initialPath = "/",
    overrides = {},
  }: {
    state: AuthState;
    initialPath?: string;
    overrides?: Partial<AuthContextValue>;
  },
) {
  const auth: AuthContextValue = {
    state,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
    reloadMe: async () => {},
    can: (action) => state.status === "authenticated" && state.me.permissions.includes(action),
    ...overrides,
  };
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
  return { router, auth };
}
