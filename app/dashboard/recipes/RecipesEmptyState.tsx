"use client";

import { EmptyState } from "../components/EmptyState";

export function RecipesEmptyState() {
  return (
    <EmptyState
      icon="🍳"
      headline="No recipes yet"
      description="Share family recipes with stories behind them. Who taught you? What occasions? Keep culinary traditions alive."
      actionLabel="+ Add your first recipe"
      onAction={() => document.querySelector<HTMLButtonElement>("[data-add-recipe]")?.click()}
    />
  );
}
