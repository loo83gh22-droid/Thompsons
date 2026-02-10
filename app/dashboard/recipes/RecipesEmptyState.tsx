"use client";

import { EmptyState } from "../components/EmptyState";

export function RecipesEmptyState() {
  return (
    <EmptyState
      icon="🍳"
      headline="No recipes yet"
      description="The story behind the food—who taught it, what occasions, photos from dinners. Add your first recipe with its story."
      actionLabel="Add your first recipe"
      onAction={() => document.querySelector<HTMLButtonElement>("[data-add-recipe]")?.click()}
    />
  );
}
