"use client";

import { useState, useTransition } from "react";
import { updateBucketListStatus } from "./actions";

type BucketItem = {
  id: string;
  title: string;
  scope: "family" | "personal";
};

export function CompleteItemSheet({
  item,
  onClose,
}: {
  item: BucketItem;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateBucketListStatus(item.id, "completed", note);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-md rounded-t-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl sm:rounded-2xl">
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
        </div>

        <div className="p-6">
          <div className="mb-2 text-center text-5xl">🎉</div>
          <h2 className="mb-1 text-center font-display text-xl font-bold text-[var(--foreground)]">
            You did it!
          </h2>
          <p className="mb-5 text-center text-sm text-[var(--muted)]">
            &ldquo;{item.title}&rdquo;
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]" htmlFor="complete-note">
                How did it go? <span className="font-normal text-[var(--muted)]">(optional)</span>
              </label>
              <textarea
                id="complete-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write a sentence about the moment — future you will love reading this."
                rows={3}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none resize-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Marking…" : "✓ Mark complete"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
