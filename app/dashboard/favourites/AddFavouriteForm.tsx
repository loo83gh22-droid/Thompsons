"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addFavourite } from "./actions";
import type { FavouriteCategory } from "./actions";

export function AddFavouriteForm({
  category,
  categoryLabel,
  memberId,
  memberName,
}: {
  category: FavouriteCategory;
  categoryLabel: string;
  memberId: string;
  memberName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [age, setAge] = useState("");

  const singular = categoryLabel.toLowerCase().replace(/s$/, "");

  function handleClose() {
    setOpen(false);
    setTitle("");
    setDescription("");
    setNotes("");
    setAge("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const parsedAge = age.trim() ? parseInt(age.trim(), 10) : undefined;
    try {
      await addFavourite(
        category,
        title.trim(),
        memberId,
        description.trim() || undefined,
        notes.trim() || undefined,
        Number.isFinite(parsedAge) ? parsedAge : undefined,
      );
      handleClose();
      router.refresh();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  // Outer div takes full width when open so it wraps below the heading in a flex-wrap row
  return (
    <div className={open ? "w-full" : undefined}>
      {!open && (
        <button
          type="button"
          data-add-favourite
          onClick={() => setOpen(true)}
          className="min-h-[36px] rounded-full border border-[var(--accent)]/50 px-4 py-1.5 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          + Add
        </button>
      )}

      {open && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <p className="mb-3 text-sm text-[var(--muted)]">
            Adding for{" "}
            <span className="font-medium text-[var(--foreground)]">{memberName}</span>
          </p>
          <input
            type="text"
            placeholder={`Add a ${singular}…`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <label className="text-sm text-[var(--muted)] whitespace-nowrap">
              Age at the time
            </label>
            <input
              type="number"
              min={0}
              max={120}
              placeholder="e.g. 5"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-24 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
