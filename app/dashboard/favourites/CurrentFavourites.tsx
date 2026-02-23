"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeFavourite, updateFavourite } from "./actions";

type Item = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  created_at: string;
};

export function CurrentFavourites({
  items,
  memberName,
  categoryLabel,
}: {
  items: Item[];
  memberName: string;
  categoryLabel: string;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleRemove(id: string) {
    setRemoving(id);
    try {
      await removeFavourite(id);
      router.refresh();
    } finally {
      setRemoving(null);
    }
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditNotes(item.notes || "");
  }

  async function handleSave() {
    if (!editingId || !editTitle.trim()) return;
    setSaving(true);
    try {
      await updateFavourite(editingId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      setEditingId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-6 py-10 text-center">
        <p className="text-2xl">⭐</p>
        <p className="mt-2 font-medium text-[var(--foreground)]">
          {memberName} hasn&apos;t added any {categoryLabel.toLowerCase()} yet
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Use the + Add button above to add their first favourite
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        if (editingId === item.id) {
          return (
            <div
              key={item.id}
              className="rounded-xl border border-[var(--accent)]/50 bg-[var(--surface)] p-4"
            >
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title"
                autoFocus
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--muted)] placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:outline-none"
              />
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--muted)] placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:outline-none"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg border border-[var(--border)] px-4 py-1.5 text-sm hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.id}
            className="group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--accent)]/40 hover:shadow-sm"
          >
            <h3 className="font-medium leading-snug text-[var(--foreground)]">
              {item.title}
            </h3>
            {item.description && (
              <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                {item.description}
              </p>
            )}
            {item.notes && (
              <p className="mt-1.5 text-xs italic text-[var(--muted)]">
                {item.notes}
              </p>
            )}
            <div className="mt-3 flex gap-3 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => startEdit(item)}
                className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={removing === item.id}
                className="text-xs text-[var(--muted)] transition-colors hover:text-red-500 disabled:opacity-50"
              >
                {removing === item.id ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
