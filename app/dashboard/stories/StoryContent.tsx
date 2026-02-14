"use client";

import { SafeMarkdown } from "@/app/components/SafeMarkdown";

export function StoryContent({ content }: { content: string }) {
  return <SafeMarkdown content={content} />;
}
