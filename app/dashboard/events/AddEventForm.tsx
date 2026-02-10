"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "./actions";
import { EVENT_CATEGORIES } from "./constants";

type Member = { id: string; name: string };

export function AddEventForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [recurringAnnual, setRecurringAnnual] = useState(false);
  const [category, setCategory] = useState("other");
  const [inviteeIds, setInviteeIds] = useState<string[]>([]);

  useEffect(() => {
    if (open && !eventDate) {
      setEventDate(new Date().toISOString().slice(0, 10));
    }
  }, [open, eventDate]);

  function toggleInvitee(id: string) {
    setInviteeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;
    setLoading(true);
    setError(null);
    const result = await createEvent(
      title.trim().slice(0, 100),
      eventDate,
      description.trim().slice(0, 500) || null,
      recurringAnnual ? "annual" : "none",
      category,
      inviteeIds
    );
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setTitle("");
    setEventDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setRecurringAnnual(false);
    setCategory("other");
    setInviteeIds([]);
    router.refresh();
  }

  function closeModal() {
    setOpen(false);
    setError(null);
  }

  if (!open) {
    return (
      <button
        type="button"
        data-add-event
        onClick={() => setOpen(true)}
        className="min-h-[44px] shrink-0 rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-[var(--background)] transition-colors hover:bg-[var(--accent-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:py-2"
      >
        + Add event
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" aria-hidden onClick={closeModal} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-event-title"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <h2 id="add-event-title" className="font-display text-lg font-semibold text-[var(--foreground)]">
              Add event
            </h2>
            <button
              type="button"
              onClick={closeModal}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            <div>
              <label htmlFor="event-title" className="block text-sm font-medium text-[var(--muted)]">
                What are we celebrating? *
              </label>
              <input
                id="event-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
                className="input-base mt-1"
                placeholder="e.g., Mom's Birthday, Family Reunion, Thanksgiving"
              />
            </div>
            <div>
              <label htmlFor="event-date" className="block text-sm font-medium text-[var(--muted)]">
                When is it? *
              </label>
              <input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="input-base mt-1"
              />
            </div>
            <div>
              <label htmlFor="event-category" className="block text-sm font-medium text-[var(--muted)]">
                Event type *
              </label>
              <select
                id="event-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-base mt-1"
              >
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Add details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                className="input-base mt-1 min-h-[80px] resize-y"
                placeholder="e.g., Dinner at 6pm, bring a gift"
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-[var(--muted)]">
                Who&apos;s involved?
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {members.map((m) => (
                  <label
                    key={m.id}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)]/10"
                  >
                    <input
                      type="checkbox"
                      checked={inviteeIds.includes(m.id)}
                      onChange={() => toggleInvitee(m.id)}
                      className="rounded"
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={recurringAnnual}
                onChange={(e) => setRecurringAnnual(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-[var(--muted)]">Repeat every year</span>
            </label>
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="btn-submit rounded-lg bg-[var(--accent)] font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50"
              >
                {loading ? "Saving…" : "Save Event"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="btn-secondary rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
