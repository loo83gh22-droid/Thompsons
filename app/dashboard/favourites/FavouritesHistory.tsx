"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { restoreFavourite } from "./actions";

type HistoryItem = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  removed_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FavouritesHistory({ items }: { items: HistoryItem[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  if (!items.length) return null;

  async function handleRestore(id: string) {
    setRestoring(id);
    try {
      await restoreFavourite(id);
      router.refresh();
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="mt-10">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
      >
        <span
          className={`inline-block text-[10px] transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        >
          ▶
        </span>
        History &mdash; {items.length} past {items.length === 1 ? "item" : "items"}
      </button>

      {isOpen && (
        <div className="mt-5 border-l-2 border-[var(--border)] pl-5 space-y-0">
          {items.map((item) => (
            <div key={item.id} className="relative pb-5 last:pb-0">
              {/* Timeline dot */}
              <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-[var(--border)] bg-[var(--background)]" />

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-[var(--muted)]">
                    Removed {formatDate(item.removed_at)}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--muted)] line-through decoration-[var(--muted)]/40">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="mt-0.5 truncate text-xs text-[var(--muted)]/60">
                      {item.description}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-[var(--muted)]/50">
                    Added {formatDate(item.created_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRestore(item.id)}
                  disabled={restoring === item.id}
                  className="shrink-0 text-xs text-[var(--accent)] underline-offset-2 hover:underline disabled:opacity-50"
                >
                  {restoring === item.id ? "Restoring…" : "Restore"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
