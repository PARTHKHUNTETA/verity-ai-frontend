/**
 * Minimal Server-Sent Events parser for a fetch() response body.
 *
 * Wire format: messages separated by a blank line; each line is `field: value`.
 *   event: delta
 *   data: {"offset":0,"text":"Hello"}
 *
 * Lines starting with ":" are comments (the server's heartbeat "ping") and are skipped.
 */
export type SseMessage = { event: string; data: string };

export async function* readSse(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseMessage, void, undefined> {
  const reader = body.getReader();
  // stream: true keeps multi-byte characters intact when they're split across chunks.
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      // A chunk can end in the middle of a message; keep the unfinished part for next time.
      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const message = parseMessage(raw);
        if (message) yield message;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseMessage(raw: string): SseMessage | null {
  let event = "message";
  const data: string[] = [];
  for (const line of raw.split("\n")) {
    if (line === "" || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }
  return data.length > 0 ? { event, data: data.join("\n") } : null;
}
