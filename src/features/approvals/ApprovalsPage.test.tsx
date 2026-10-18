import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithAuth, testMe } from "@/test/render";
import type { ApprovalRequest } from "@/types/api";
import { ApprovalsPage } from "./ApprovalsPage";

const api = vi.hoisted(() => ({ list: vi.fn(), decide: vi.fn(), pendingCount: vi.fn() }));
vi.mock("@/services/governance-api", () => ({ approvalsApi: api }));

const budgetRequest: ApprovalRequest = {
  id: "a1",
  runId: "r1",
  kind: "budget",
  summary: "Allow more steps: used 3 of 3",
  status: "pending",
  comment: null,
  createdAt: new Date().toISOString(),
  decidedAt: null,
  details: { limit: "maxSteps", max: 3, used: 3 },
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  question: "How do agents plan?",
  requestedByEmail: "res@example.com",
};

describe("ApprovalsPage", () => {
  beforeEach(() => {
    api.list.mockImplementation(async (status: string) =>
      status === "pending" ? [budgetRequest] : [],
    );
    api.decide.mockResolvedValue({ id: "a1", status: "approved" });
  });

  it("suggests doubling the budget and sends the reviewer's decision", async () => {
    renderWithAuth([{ path: "/", element: <ApprovalsPage /> }], {
      state: { status: "authenticated", me: testMe },
    });

    expect(await screen.findByText("Allow more steps: used 3 of 3")).toBeInTheDocument();
    expect(screen.getByLabelText("New limit")).toHaveValue(6);

    await userEvent.type(screen.getByLabelText("Comment"), "one-off");
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() =>
      expect(api.decide).toHaveBeenCalledWith("a1", {
        decision: "approve",
        comment: "one-off",
        newLimit: 6,
      }),
    );
  });
});
