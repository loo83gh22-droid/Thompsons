"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "./actions";

type Member = { id: string; name: string };

const CATEGORIES = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "holiday", label: "Holiday" },
  { value: "reunion", label: "Reunion" },
  { value: "other", label: "Other" },
];

const RECURRING = [
  { value: "none", label: "One-time" },
  { value: "annual", label: "Every year" },
  { value: "monthly", label: "Every month" },
];

export function AddEventForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [recurring, setRecurring] = useState("none");
  const [category, setCategory] = useState("other");
  const [inviteeIds, setInviteeIds] = useState<string[]>([]);

  function toggleInvitee(id: string) {
    setInviteeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;
    setLoading(true);
    setError(null);
    const result = await createEvent(title.trim(), eventDate, description.trim() || null, recurring, category, inviteeIds);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setTitle("");
    setEventDate("");
    setDescription("");
    setRecurring("none");
    setCategory("other");
    setInviteeIds([]);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        data-add-event
        onClick={() => setOpen(true)}
        className="min-h-[44px] rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--background)] transition-colors hover:bg-[var(--accent-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        + Add event
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
      <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">Add event</h3>
      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="event-title" className="block text-sm font-medium text-[var(--muted)]">Title</label>
          <input
            id="event-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="input-base mt-1"
            placeholder="e.g. Mom's Birthday"
          />
        </div>
        <div>
          <label htmlFor="event-date" className="block text-sm font-medium text-[var(--muted)]">Date</label>
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
          <label htmlFor="event-category" className="block text-sm font-medium text-[var(--muted)]">Category</label>
          <select id="event-category" value={category} onChange={(e) => setCategory(e.target.value)} className="input-base mt-1">
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="event-recurring" className="block text-sm font-medium text-[var(--muted)]">Repeats</label>
          <select id="event-recurring" value={recurring} onChange={(e) => setRecurring(e.target.value)} className="input-base mt-1">
            {RECURRING.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-base mt-1 min-h-[80px] resize-y"
            placeholder="Details..."
          />
        </div>
        <div>
          <span className="block text-sm font-medium text-[var(--muted)]">Invite family members (optional)</span>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Who should be reminded? Leave empty for everyone.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {members.map((m) => (
              <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)]/10">
                <input type="checkbox" checked={inviteeIds.includes(m.id)} onChange={() => toggleInvitee(m.id)} className="rounded" />
                {m.name}
              </label>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="form-actions-mobile flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="submit" disabled={loading} className="btn-submit rounded-lg bg-[var(--accent)] font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
            {loading ? "Creating..." : "Create event"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
