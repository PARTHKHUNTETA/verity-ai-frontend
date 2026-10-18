/**
 * Turns citation markers in the answer's Markdown into links react-markdown can render as
 * chips: "[1]" → "[1](#cite-1)", "[2, 5]" → "[2](#cite-2)[5](#cite-5)".
 * Code (inline `…` and fenced ```…```) is left untouched, and so are real Markdown links.
 */
const MARKER = /\[(\d+(?:\s*,\s*\d+)*)\](?!\()/g;
const CODE = /(```[\s\S]*?(?:```|$)|`[^`\n]*`)/g;

export function linkifyCitations(markdown: string): string {
  return markdown
    .split(CODE)
    .map((part, i) =>
      i % 2 === 1
        ? part // odd parts are code
        : part.replace(MARKER, (_, numbers: string) =>
            numbers
              .split(",")
              .map((n) => `[${n.trim()}](#cite-${n.trim()})`)
              .join(""),
          ),
    )
    .join("");
}

export const CITE_PREFIX = "#cite-";
