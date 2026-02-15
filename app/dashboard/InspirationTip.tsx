"use client";

import { useState, useEffect } from "react";

const tips = [
  "Ask a grandparent about their childhood recipe and add it to Recipes.",
  "Record a voice memo of your family's favourite inside joke.",
  "Write about your favourite holiday tradition in the Journal.",
  "Upload a photo from your most recent family gathering.",
  "What advice would you give your future self? Write a Time Capsule.",
  "Tell the story of how your parents met in Stories.",
  "Document a recipe that's been passed down through generations.",
  "Record a lullaby or bedtime song as a voice memo.",
  "Write a journal entry about your favourite childhood memory.",
  "Add a pin to the Family Map for a place that means a lot to your family.",
  "Ask a family member to share their perspective on a journal entry.",
  "Write about a tradition your family has kept alive for years.",
  "Send a surprise pop-up message to your family for when they log in.",
  "Capture the story behind your family's favourite meal.",
  "Record a voice memo telling your kids something you want them to remember.",
  "Write about a lesson you learned from a family elder.",
  "Upload a photo from a trip and add a journal entry about it.",
  "What's your family's funniest story? Write it down before it's forgotten.",
];

export function InspirationTip() {
  const [tip, setTip] = useState("");

  useEffect(() => {
    const daySeed = Math.floor(Date.now() / 86_400_000);
    setTip(tips[daySeed % tips.length]);
  }, []);

  if (!tip) return null;

  return (
    <section className="rounded-2xl border border-[var(--accent)]/20 bg-gradient-to-br from-[var(--accent)]/5 to-[var(--surface)] p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
        Daily Inspiration
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        A little nudge to capture what matters.
      </p>
      <div className="mt-4 flex gap-3 rounded-xl bg-[var(--card)] p-4">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-xl" aria-hidden="true">
          💡
        </span>
        <p className="text-sm leading-relaxed text-[var(--foreground)]">
          {tip}
        </p>
      </div>
    </section>
  );
}
