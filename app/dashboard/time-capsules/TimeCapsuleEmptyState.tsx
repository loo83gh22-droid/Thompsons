"use client";

import { EmptyState } from "../components/EmptyState";

export function TimeCapsuleSentEmpty() {
  return (
    <EmptyState
      icon="📮"
      headline="No letters yet"
      description="Write a letter to a family member for the future. Seal it until a date—like when they turn 18."
      actionLabel="Write your first letter"
      onAction={() => document.querySelector<HTMLButtonElement>("[data-time-capsule-add]")?.click()}
    />
  );
}