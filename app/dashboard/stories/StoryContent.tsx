"use client";

import ReactMarkdown from "react-markdown";

const containerClass =
  "text-[var(--foreground)]/90 leading-relaxed [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 " +
  "[&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 " +
  "[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 " +
  "[&_a]:text-[var(--accent)] [&_a]:underline hover:[&_a]:no-underline [&_strong]:font-semibold [&_em]:italic";

export function StoryContent({ content }: { content: string }) {
  return (
    <div className={containerClass}>
      <ReactMarkdown>{content || ""}</ReactMarkdown>
    </div>
  );
}
