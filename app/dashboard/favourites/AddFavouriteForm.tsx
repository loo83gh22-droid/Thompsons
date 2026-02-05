"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addFavourite } from "./actions";
import type { FavouriteCategory } from "./actions";

type FamilyMember = { id: string; name: string };

export function AddFavouriteForm({
  category,
  categoryLabel,
  familyMembers,
}: {
  category: FavouriteCategory;
  categoryLabel: string;
  familyMembers: FamilyMember[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [addedBy, setAddedBy] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await addFavourite(category, title.trim(), description.trim() || undefined, notes.trim() || undefined, addedBy || undefined);
      setTitle("");
      setDescription("");
      setNotes("");
      setAddedBy("");
      setOpen(false);
      router.refresh();
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {open ? (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <input
            type="text"
            placeholder={`Add a ${categoryLabel.toLowerCase().replace(/s$/, "")}...`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Notes (e.g. Great for game night)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <select
            value={addedBy}
            onChange={(e) => setAddedBy(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Who added this?</option>
            {familyMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-[var(--accent)]/50 px-4 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
        >
          + Add
        </button>
      )}
    </div>
  );
}
