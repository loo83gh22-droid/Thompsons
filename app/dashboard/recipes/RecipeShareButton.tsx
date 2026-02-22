"use client";

import { ShareButton } from "@/app/components/ShareButton";
import { toggleRecipeShare } from "../stories/share-actions";

export function RecipeShareButton({
  recipeId,
  title,
  isPublic,
  shareToken,
}: {
  recipeId: string;
  title: string;
  isPublic: boolean;
  shareToken: string | null;
}) {
  return (
    <ShareButton
      isPublic={isPublic}
      shareToken={shareToken}
      shareType="recipe"
      title={title}
      onToggle={() => toggleRecipeShare(recipeId)}
    />
  );
}
