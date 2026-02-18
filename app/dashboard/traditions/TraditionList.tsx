"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeTradition } from "./actions";
import { EmptyStateGuide } from "@/app/components/EmptyStateGuide";

type Tradition = {
  id: string;
  title: string;
  description: string;
  when_it_happens: string | null;
  added_by: string | null;
  added_by_member: { name: string } | { name: string }[] | null;
};

export function TraditionList({ traditions }: { traditions: Tradition[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Remove this tradition?")) return;
    setDeletingId(id);
    try {
      await removeTradition(id);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (!traditions.length) {
    return (
      <EmptyStateGuide
        icon="🎉"
        title="Your family's quirks are worth preserving."
        description="Traditions aren't just the big ones — it's Taco Tuesday, the road trip playlist, the way you do birthdays. Write them down before they disappear between generations."
        inspiration={[
          "The birthday routine — the exact cake, the song, the embarrassing traditions",
          "What your family does every Christmas, Eid, Diwali, or 'just because it's ours'",
          "The weekly ritual that became non-negotiable without anyone deciding it",
          "The inside jokes, the road trip games, the bedtime rituals only your kids know",
        ]}
        ctaLabel="+ Add your first tradition"
        onAction={() => document.querySelector<HTMLButtonElement>("[data-add-tradition]")?.click()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {traditions.map((t) => {
        const addedBy = Array.isArray(t.added_by_member) ? t.added_by_member[0] : t.added_by_member;
        return (
          <article
            key={t.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">
                  {t.title}
                </h3>
                {t.when_it_happens && (
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    When: {t.when_it_happens}
                  </p>
                )}
                <div className="mt-3 whitespace-pre-wrap text-[var(--foreground)]/90">
                  {t.description}
                </div>
                {addedBy?.name && (
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    Added by {addedBy.name}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                disabled={deletingId === t.id}
                className="flex-shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                {deletingId === t.id ? "..." : "Remove"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
