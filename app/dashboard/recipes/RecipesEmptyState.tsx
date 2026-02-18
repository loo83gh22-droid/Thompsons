"use client";

import { EmptyStateGuide } from "@/app/components/EmptyStateGuide";

export function RecipesEmptyState() {
  return (
    <EmptyStateGuide
      icon="🧑‍🍳"
      title="Every family has a secret ingredient. What's yours?"
      description="This is where the food lives — the recipes, the stories behind them, who taught them, and the dinners they made unforgettable."
      inspiration={[
        "Grandma's signature holiday dish — and the story of who taught her",
        "The recipe that always appears at Christmas, or Easter, or 'just because'",
        "A dish from the old country that travelled across generations",
        "Your family's chaotic but beloved weeknight go-to",
      ]}
      ctaLabel="+ Add your first recipe"
      onAction={() => document.querySelector<HTMLButtonElement>("[data-add-recipe]")?.click()}
    />
  );
}
