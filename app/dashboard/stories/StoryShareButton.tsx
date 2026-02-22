"use client";

import { ShareButton } from "@/app/components/ShareButton";
import { toggleStoryShare } from "./share-actions";

export function StoryShareButton({
  storyId,
  title,
  isPublic,
  shareToken,
}: {
  storyId: string;
  title: string;
  isPublic: boolean;
  shareToken: string | null;
}) {
  return (
    <ShareButton
      isPublic={isPublic}
      shareToken={shareToken}
      shareType="story"
      title={title}
      onToggle={() => toggleStoryShare(storyId)}
    />
  );
}
