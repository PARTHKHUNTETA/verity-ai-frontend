import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/services/api-client";
import { renderWithAuth } from "@/test/render";
import { LoginPage } from "./LoginPage";

const routes = [
  { path: "/login", element: <LoginPage /> },
  { path: "/research", element: <p>Research page</p> },
];

describe("LoginPage", () => {
  it("signs in and returns to the page the user originally wanted", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    const { router } = renderWithAuth(routes, {
      state: { status: "anonymous" },
      initialPath: "/login",
      overrides: { login },
    });
    // Simulate arriving from a redirect by ProtectedRoute.
    await router.navigate("/login", { state: { from: "/research" } });

    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "correct-horse-battery");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(login).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "correct-horse-battery",
    });
    expect(await screen.findByText("Research page")).toBeInTheDocument();
  });

  it("shows the server's error message when sign-in fails", async () => {
    const login = vi
      .fn()
      .mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "Invalid email or password"));
    renderWithAuth(routes, {
      state: { status: "anonymous" },
      initialPath: "/login",
      overrides: { login },
    });

    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });
});
