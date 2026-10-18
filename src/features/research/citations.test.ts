import { describe, expect, it } from "vitest";
import { linkifyCitations } from "./citations";

describe("linkifyCitations", () => {
  it("turns markers into citation links", () => {
    expect(linkifyCitations("RAG helps [1]. It reduces errors [2, 5].")).toBe(
      "RAG helps [1](#cite-1). It reduces errors [2](#cite-2)[5](#cite-5).",
    );
  });

  it("leaves code and real links alone", () => {
    const md = "Use `arr[1]` here.\n\n```\nx[2] = 3\n```\n\nSee [docs](https://x.dev) [3].";
    expect(linkifyCitations(md)).toBe(
      "Use `arr[1]` here.\n\n```\nx[2] = 3\n```\n\nSee [docs](https://x.dev) [3](#cite-3).",
    );
  });

  it("works on half-streamed text with an unclosed code fence", () => {
    expect(linkifyCitations("Fact [1].\n```\ncode [2]")).toBe("Fact [1](#cite-1).\n```\ncode [2]");
  });
});
