"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { addRecipe } from "./actions";

type Member = { id: string; name: string };
type JournalPhoto = {
  id: string;
  url: string;
  caption: string | null;
  journal_entries: { title: string; trip_date: string | null } | { title: string; trip_date: string | null }[] | null;
};

export function AddRecipeForm({
  members,
  journalPhotos = [],
}: {
  members: Member[];
  journalPhotos: JournalPhoto[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [taughtById, setTaughtById] = useState("");
  const [occasions, setOccasions] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [addedById, setAddedById] = useState("");
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

  function togglePhoto(id: string) {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await addRecipe({
        title: title.trim(),
        story: story.trim() || undefined,
        taughtById: taughtById || undefined,
        occasions: occasions.trim() || undefined,
        ingredients: ingredients.trim() || undefined,
        instructions: instructions.trim() || undefined,
        addedById: addedById || undefined,
        photoIds: Array.from(selectedPhotoIds),
      });
      setTitle("");
      setStory("");
      setTaughtById("");
      setOccasions("");
      setIngredients("");
      setInstructions("");
      setAddedById("");
      setSelectedPhotoIds(new Set());
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--background)] transition-colors hover:bg-[var(--accent-muted)]"
      >
        + Add recipe
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">
        Add a recipe
      </h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        The story behind the food — who taught it, when it&apos;s made, photos from dinners.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Recipe name *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Grandma's lasagna"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            The story
          </label>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={4}
            placeholder="Who taught you? Where did it come from? What makes it special?"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Learned from / taught by
          </label>
          <select
            value={taughtById}
            onChange={(e) => setTaughtById(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Select...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Occasions
          </label>
          <input
            type="text"
            value={occasions}
            onChange={(e) => setOccasions(e.target.value)}
            placeholder="e.g. Christmas, Easter, Sunday dinners"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Ingredients
          </label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={3}
            placeholder="List ingredients..."
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            placeholder="How to make it..."
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Who added this
          </label>
          <select
            value={addedById}
            onChange={(e) => setAddedById(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Select...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {journalPhotos.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Link to photos from dinners
            </label>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Select photos from your journal where this recipe was served.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {journalPhotos.map((photo) => {
                const entry = Array.isArray(photo.journal_entries)
                  ? photo.journal_entries[0]
                  : photo.journal_entries;
                const label = entry?.title || "Photo";
                const selected = selectedPhotoIds.has(photo.id);
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => togglePhoto(photo.id)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      selected
                        ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                        : "border-[var(--border)] hover:border-[var(--muted)]"
                    }`}
                    title={label}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.caption || label}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    {selected && (
                      <span className="absolute right-1 top-1 rounded-full bg-[var(--accent)] p-1 text-white">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-[var(--border)] px-4 py-2 font-medium hover:bg-[var(--surface-hover)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
