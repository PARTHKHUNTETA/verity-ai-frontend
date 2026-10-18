import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders the answer's Markdown. react-markdown never renders raw HTML from the text,
 * so model output can't inject scripts into the page.
 */
export function AnswerView({ content, streaming }: { content: string; streaming: boolean }) {
  return (
    <div className="prose prose-slate prose-sm sm:prose-base prose-headings:font-semibold prose-a:text-brand-600 max-w-none">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
      {streaming && (
        <span
          aria-hidden="true"
          className="bg-brand-500 ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm align-middle"
        />
      )}
    </div>
  );
}
