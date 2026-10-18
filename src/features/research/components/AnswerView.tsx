import { useMemo } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Citation } from "@/types/api";
import { CITE_PREFIX, linkifyCitations } from "../citations";
import { CitationChip } from "./CitationChip";

/**
 * Renders the answer's Markdown with clickable citations. react-markdown never renders raw
 * HTML from the text, so model output can't inject scripts into the page.
 */
export function AnswerView({
  content,
  streaming,
  citations = [],
}: {
  content: string;
  streaming: boolean;
  citations?: Citation[];
}) {
  const components = useMemo<Components>(() => {
    const byNumber = new Map(citations.map((c) => [c.number, c]));
    return {
      a: ({ href, children, ...props }) => {
        if (href?.startsWith(CITE_PREFIX)) {
          const n = Number(href.slice(CITE_PREFIX.length));
          return <CitationChip number={n} citation={byNumber.get(n)} />;
        }
        return (
          <a href={href} target="_blank" rel="noreferrer noopener" {...props}>
            {children}
          </a>
        );
      },
    };
  }, [citations]);

  return (
    <div className="prose prose-slate prose-sm sm:prose-base prose-headings:font-semibold prose-a:text-brand-600 max-w-none">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {linkifyCitations(content)}
      </Markdown>
      {streaming && (
        <span
          aria-hidden="true"
          className="bg-brand-500 ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm align-middle"
        />
      )}
    </div>
  );
}
