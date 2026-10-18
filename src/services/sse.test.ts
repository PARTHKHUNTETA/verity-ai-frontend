import { describe, expect, it } from "vitest";
import { readSse, type SseMessage } from "./sse";

/** A stream that delivers the given chunks one by one, like a real network response. */
function streamOf(chunks: Array<string | Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(typeof c === "string" ? encoder.encode(c) : c);
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>) {
  const out: SseMessage[] = [];
  for await (const m of readSse(stream)) out.push(m);
  return out;
}

describe("readSse", () => {
  it("parses named events", async () => {
    const messages = await collect(
      streamOf(['event: status\ndata: {"status":"running"}\n\nevent: done\ndata: {}\n\n']),
    );
    expect(messages).toEqual([
      { event: "status", data: '{"status":"running"}' },
      { event: "done", data: "{}" },
    ]);
  });

  it("reassembles messages split across chunks", async () => {
    const messages = await collect(
      streamOf(["event: del", 'ta\ndata: {"offset":0,', '"text":"Hi"}\n', "\n"]),
    );
    expect(messages).toEqual([{ event: "delta", data: '{"offset":0,"text":"Hi"}' }]);
  });

  it("skips heartbeat comments", async () => {
    const messages = await collect(streamOf([": ping\n\nevent: done\ndata: {}\n\n"]));
    expect(messages).toEqual([{ event: "done", data: "{}" }]);
  });

  it("keeps multi-byte characters intact when a chunk splits them", async () => {
    const bytes = new TextEncoder().encode('event: delta\ndata: {"text":"café ✓"}\n\n');
    const splitAt = bytes.indexOf(0xc3) + 1; // in the middle of "é"
    const messages = await collect(streamOf([bytes.slice(0, splitAt), bytes.slice(splitAt)]));
    expect(messages[0]!.data).toBe('{"text":"café ✓"}');
  });
});
