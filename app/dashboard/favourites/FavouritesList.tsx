"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeFavourite, updateFavourite } from "./actions";
import { EmptyState } from "../components/EmptyState";

type Item = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  added_by: string | null;
  family_members: { name: string } | { name: string }[] | null;
};

type FamilyMember = { id: string; name: string };

export function FavouritesList({
  items,
  familyMembers = [],
}: {
  items: Item[];
  familyMembers?: FamilyMember[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editAddedBy, setEditAddedBy] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRemove(id: string) {
    await removeFavourite(id);
    router.refresh();
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditNotes(item.notes || "");
    setEditAddedBy(item.added_by || "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSave() {
    if (!editingId || !editTitle.trim()) return;
    setLoading(true);
    try {
      await updateFavourite(editingId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        notes: editNotes.trim() || undefined,
        familyMemberId: editAddedBy || undefined,
      });
      setEditingId(null);
      router.refresh();
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  }

  if (!items.length) {
    return (
      <EmptyState
        icon="⭐"
        headline="Nothing here yet"
        description="Be the first to add a favourite. Share what you love with the family."
        actionLabel="Add your first one"
        onAction={() => document.querySelector<HTMLButtonElement>("[data-add-favourite]")?.click()}
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const author = Array.isArray(item.family_members) ? item.family_members[0] : item.family_members;

        if (editingId === item.id) {
          return (
            <div
              key={item.id}
              className="rounded-xl border border-[var(--accent)]/50 bg-[var(--background)] p-4"
            >
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              />
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notes"
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              />
              <select
                value={editAddedBy}
                onChange={(e) => setEditAddedBy(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="">Who added this?</option>
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-hover)]"
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
            className="group relative rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 transition-all hover:border-[var(--accent)]/30"
          >
            <h3 className="font-medium text-[var(--foreground)]">{item.title}</h3>
            {item.description && (
              <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
                {item.description}
              </p>
            )}
            {(item.notes || author?.name) && (
              <p className="mt-2 text-xs text-[var(--muted)]">
                {[item.notes, author?.name && `— ${author.name}`].filter(Boolean).join(" ")}
              </p>
            )}
            <div className="mt-2 flex gap-2 opacity-70 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => startEdit(item)}
                className="text-xs text-[var(--muted)] hover:text-[var(--accent)]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="text-xs text-[var(--muted)] hover:text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
