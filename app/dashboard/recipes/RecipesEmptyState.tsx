"use client";

import { EmptyStateGuide } from "@/app/components/EmptyStateGuide";

export function RecipesEmptyState() {
  return (
    <EmptyStateGuide
      icon="🍳"
      title="No recipes yet"
      description="Share family recipes with the stories behind them"
      inspiration={[
        "Grandma's signature holiday dish and who she learned it from",
        "Your family's go-to weeknight dinner",
        "The recipe that always comes out at celebrations",
        "A dish from the old country that's been passed down",
      ]}
      ctaLabel="+ Add your first recipe"
      onAction={() => document.querySelector<HTMLButtonElement>("[data-add-recipe]")?.click()}
    />
  );
}
