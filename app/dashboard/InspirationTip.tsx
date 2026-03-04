"use client";

import { useState } from "react";
import Link from "next/link";

const tips = [
  { text: "Ask a grandparent about their childhood recipe and add it to Recipes.", href: "/dashboard/recipes/new", cta: "Add Recipe" },
  { text: "Record a voice memo of your family's favourite inside joke.", href: "/dashboard/voice-memos", cta: "Record Memo" },
  { text: "Write about your favourite holiday tradition in the Journal.", href: "/dashboard/journal/new", cta: "Write Entry" },
  { text: "Upload a photo from your most recent family gathering.", href: "/dashboard/photos", cta: "Upload Photo" },
  { text: "What advice would you give your future self? Write a Time Capsule.", href: "/dashboard/time-capsules/new", cta: "Create Capsule" },
  { text: "Tell the story of how your parents met in Stories.", href: "/dashboard/stories/new", cta: "Write Story" },
  { text: "Document a recipe that's been passed down through generations.", href: "/dashboard/recipes/new", cta: "Add Recipe" },
  { text: "Record a lullaby or bedtime song as a voice memo.", href: "/dashboard/voice-memos", cta: "Record Memo" },
  { text: "Write a journal entry about your favourite childhood memory.", href: "/dashboard/journal/new", cta: "Write Entry" },
  { text: "Add a pin to the Family Map for a place that means a lot to your family.", href: "/dashboard/map", cta: "Open Map" },
  { text: "Ask a family member to share their perspective on a journal entry.", href: "/dashboard/journal", cta: "View Journal" },
  { text: "Write about a tradition your family has kept alive for years.", href: "/dashboard/traditions", cta: "Add Tradition" },
  { text: "Send a surprise pop-up message to your family for when they log in.", href: "/dashboard/messages", cta: "Send Message" },
  { text: "Capture the story behind your family's favourite meal.", href: "/dashboard/recipes/new", cta: "Add Recipe" },
  { text: "Record a voice memo telling your kids something you want them to remember.", href: "/dashboard/voice-memos", cta: "Record Memo" },
  { text: "Write about a lesson you learned from a family elder.", href: "/dashboard/journal/new", cta: "Write Entry" },
  { text: "Upload a photo from a trip and add a journal entry about it.", href: "/dashboard/photos", cta: "Upload Photo" },
  { text: "What's your family's funniest story? Write it down before it's forgotten.", href: "/dashboard/stories/new", cta: "Write Story" },
];

export function InspirationTip() {
  const [tip] = useState(() => {
    const daySeed = Math.floor(Date.now() / 86_400_000);
    return tips[daySeed % tips.length];
  });

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
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-sm leading-relaxed text-[var(--foreground)]">
            {tip.text}
          </p>
          <Link
            href={tip.href}
            className="self-start rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-md"
          >
            {tip.cta} →
          </Link>
        </div>
      </div>
    </section>
  );
}
