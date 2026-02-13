"use client";

import { EmptyStateGuide } from "@/app/components/EmptyStateGuide";

export function TimeCapsuleSentEmpty() {
  return (
    <EmptyStateGuide
      icon="💌"
      title="No letters written yet"
      description="Write a letter to a future version of someone you love. Seal it until the date you choose."
      inspiration={[
        "A letter to your child to open on their 18th birthday",
        "A note to your future self to open in 10 years",
        "Predictions for the family to open next New Year's",
        "Words of wisdom for a grandchild you haven't met yet",
      ]}
      ctaLabel="Write your first letter"
      onAction={() => document.querySelector<HTMLButtonElement>("[data-time-capsule-add]")?.click()}
    />
  );
}