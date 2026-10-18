import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithAuth, testMe } from "@/test/render";
import { ProtectedRoute, PublicOnlyRoute } from "./RouteGuards";

const routes = [
  {
    path: "/login",
    element: <PublicOnlyRoute />,
    children: [{ index: true, element: <p>Login page</p> }],
  },
  { element: <ProtectedRoute />, children: [{ path: "/research", element: <p>Research page</p> }] },
  { path: "/", element: <p>Home</p> },
];

describe("ProtectedRoute", () => {
  it("shows a spinner while the session is being restored", () => {
    renderWithAuth(routes, { state: { status: "loading" }, initialPath: "/research" });
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("redirects anonymous users to /login and remembers where they were going", () => {
    const { router } = renderWithAuth(routes, {
      state: { status: "anonymous" },
      initialPath: "/research?tab=1",
    });
    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(router.state.location.state).toEqual({ from: "/research?tab=1" });
  });

  it("renders the page for signed-in users", () => {
    renderWithAuth(routes, {
      state: { status: "authenticated", me: testMe },
      initialPath: "/research",
    });
    expect(screen.getByText("Research page")).toBeInTheDocument();
  });
});

describe("PublicOnlyRoute", () => {
  it("sends signed-in users away from /login", () => {
    renderWithAuth(routes, {
      state: { status: "authenticated", me: testMe },
      initialPath: "/login",
    });
    expect(screen.getByText("Home")).toBeInTheDocument();
  });
});
