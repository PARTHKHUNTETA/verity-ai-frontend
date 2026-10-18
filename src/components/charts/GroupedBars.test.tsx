import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GroupedBars } from "./GroupedBars";

const pct = (v: number) => `${Math.round(v * 100)}%`;

describe("GroupedBars", () => {
  it("labels every bar for screen readers and prints values at the tips", () => {
    render(
      <GroupedBars
        rows={[
          { label: "Claim support", values: [0.6, 0.9] },
          { label: "Source recall", values: [null, 0.5] },
        ]}
        series={[
          { label: "A", color: "red" },
          { label: "B", color: "blue" },
        ]}
        format={pct}
      />,
    );
    expect(screen.getByRole("button", { name: "Claim support, A: 60%" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Claim support, B: 90%" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Source recall, A: not measured" }),
    ).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows a tooltip on hover", async () => {
    render(
      <GroupedBars
        rows={[{ label: "Pass rate", values: [0.25, 0.75] }]}
        series={[
          { label: "A", color: "red" },
          { label: "B", color: "blue" },
        ]}
        format={pct}
      />,
    );
    await userEvent.hover(screen.getByRole("button", { name: "Pass rate, B: 75%" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent("75%Pass rate · B");
  });
});
