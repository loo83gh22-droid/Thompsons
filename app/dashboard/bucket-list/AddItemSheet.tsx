"use client";

import { useState, useTransition } from "react";
import { addBucketListItem, type BucketListCategory } from "./actions";

const CATEGORIES: { value: BucketListCategory; label: string; emoji: string }[] = [
  { value: "travel",    label: "Travel",    emoji: "✈️" },
  { value: "adventure", label: "Adventure", emoji: "🏔️" },
  { value: "learning",  label: "Learning",  emoji: "📚" },
  { value: "food",      label: "Food",      emoji: "🍽️" },
  { value: "creative",  label: "Creative",  emoji: "🎨" },
  { value: "sports",    label: "Sports",    emoji: "⚽" },
  { value: "together",  label: "Together",  emoji: "👨‍👩‍👧‍👦" },
  { value: "milestone", label: "Milestone", emoji: "🏆" },
];

export function AddItemSheet({
  currentMember,
  allMembers,
  onClose,
}: {
  currentMember: { id: string; name: string; role: string };
  allMembers: { id: string; name: string; nickname?: string | null; role: string }[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [scope, setScope] = useState<"family" | "personal">("family");
  const [isPrivate, setIsPrivate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<BucketListCategory | "">("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setError("");
    startTransition(async () => {
      try {
        await addBucketListItem({
          title,
          description: description || undefined,
          scope,
          isPrivate: scope === "personal" ? isPrivate : false,
          category: category || undefined,
          targetDate: targetDate || undefined,
          addedBy: currentMember.id,
        });
        onClose();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg rounded-t-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl sm:rounded-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
        </div>

        <div className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Add bucket list item</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Scope toggle */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Type</label>
              <div className="flex gap-2">
                {([
                  { value: "family",   label: "Family dream",   desc: "Shared with everyone" },
                  { value: "personal", label: "Personal dream",  desc: "Just for you (optionally private)" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setScope(opt.value)}
                    className={`flex-1 rounded-xl border p-3 text-left text-sm transition-colors ${
                      scope === opt.value
                        ? "border-[var(--accent)] bg-[var(--accent)]/10"
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <div className="font-medium text-[var(--foreground)]">{opt.label}</div>
                    <div className="mt-0.5 text-xs text-[var(--muted)]">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy toggle — personal only */}
            {scope === "personal" && (
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--accent)]"
                />
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">🔒 Keep private</div>
                  <div className="text-xs text-[var(--muted)]">Only you can see this dream</div>
                </div>
              </label>
            )}

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]" htmlFor="bl-title">
                Dream *
              </label>
              <input
                id="bl-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={scope === "family" ? "e.g. See the Northern Lights together" : "e.g. Learn to surf"}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]" htmlFor="bl-desc">
                Notes <span className="font-normal text-[var(--muted)]">(optional)</span>
              </label>
              <textarea
                id="bl-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any details, ideas, or context..."
                rows={2}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                Category <span className="font-normal text-[var(--muted)]">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(category === cat.value ? "" : cat.value)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                      category === cat.value
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]/40"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]" htmlFor="bl-date">
                Target date <span className="font-normal text-[var(--muted)]">(optional — "someday by...")</span>
              </label>
              <input
                id="bl-date"
                type="month"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending || !title.trim()}
                className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Adding…" : "Add to list"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
