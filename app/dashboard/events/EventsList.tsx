"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEvent, updateEvent } from "./actions";
import { getCategoryLabel, getCategoryColor } from "./constants";
import { EVENT_CATEGORIES } from "./constants";

type Invitee = { family_member_id: string; family_members: { id: string; name: string } | { id: string; name: string }[] | null };

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  recurring: string;
  category: string;
  family_members: { name: string } | { name: string }[] | null;
  family_event_invitees?: Invitee[] | null;
};

function one<T>(x: T | T[] | null): T | null {
  return x == null ? null : Array.isArray(x) ? x[0] ?? null : x;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function daysUntil(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "Past";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return `In ${diff} days`;
  if (diff <= 30) return `In ${Math.ceil(diff / 7)} weeks`;
  return formatDateShort(iso);
}

function groupEvents(events: EventRow[]): { label: string; events: EventRow[] }[] {
  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);
  const monthEnd = new Date();
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const monthEndStr = monthEnd.toISOString().slice(0, 10);

  const thisWeek: EventRow[] = [];
  const thisMonth: EventRow[] = [];
  const upcoming: EventRow[] = [];
  const past: EventRow[] = [];

  for (const e of events) {
    if (e.event_date < today) past.push(e);
    else if (e.event_date <= weekEndStr) thisWeek.push(e);
    else if (e.event_date <= monthEndStr) thisMonth.push(e);
    else upcoming.push(e);
  }

  const groups: { label: string; events: EventRow[] }[] = [];
  if (thisWeek.length) groups.push({ label: "This Week", events: thisWeek });
  if (thisMonth.length) groups.push({ label: "This Month", events: thisMonth });
  if (upcoming.length) groups.push({ label: "Upcoming", events: upcoming });
  if (past.length) groups.push({ label: "Past Events", events: past });
  return groups;
}

export function EventsList({
  events,
  members,
}: {
  events: EventRow[];
  members: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    setDeletingId(id);
    await deleteEvent(id);
    setDeletingId(null);
    router.refresh();
  }

  const groups = groupEvents(events);

  return (
    <div className="space-y-8">
      {groups.map(({ label, events: groupEvents }) => (
        <section key={label}>
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)] mb-3">
            {label}
          </h2>
          <ul className="space-y-3">
            {groupEvents.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                onEdit={() => setEditingId(e.id)}
                onDelete={() => handleDelete(e.id)}
                deleting={deletingId === e.id}
              />
            ))}
          </ul>
        </section>
      ))}

      {editingId && (
        <EditEventModal
          event={events.find((x) => x.id === editingId)!}
          members={members}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function EventCard({
  event,
  onEdit,
  onDelete,
  deleting,
}: {
  event: EventRow;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const invitees = (event.family_event_invitees ?? []).map((inv) => {
    const m = one(inv.family_members as { name: string } | { name: string }[] | null);
    return m?.name;
  }).filter(Boolean) as string[];

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]/30 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <span
          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(event.category)}`}
        >
          {getCategoryLabel(event.category)}
        </span>
        <h3 className="mt-2 font-display text-lg font-semibold text-[var(--foreground)]">
          {event.title}
        </h3>
        <p className="text-sm text-[var(--muted)]">
          {formatDate(event.event_date)}
          {event.recurring === "annual" && " (every year)"}
        </p>
        <p className="mt-0.5 text-sm font-medium text-[var(--accent)]">
          {daysUntil(event.event_date)}
        </p>
        {invitees.length > 0 && (
          <p className="mt-1 text-xs text-[var(--muted)]">
            With: {invitees.join(", ")}
          </p>
        )}
        {event.description && (
          <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
            {event.description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          aria-label="Edit"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--muted)] hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
          aria-label="Delete"
        >
          🗑️
        </button>
      </div>
    </li>
  );
}

function EditEventModal({
  event,
  members,
  onClose,
  onSaved,
}: {
  event: EventRow;
  members: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [eventDate, setEventDate] = useState(event.event_date);
  const [description, setDescription] = useState(event.description ?? "");
  const [category, setCategory] = useState(event.category);
  const [recurringAnnual, setRecurringAnnual] = useState(event.recurring === "annual");
  const [inviteeIds, setInviteeIds] = useState<string[]>(() =>
    (event.family_event_invitees ?? []).map((i) => i.family_member_id)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleInvitee(id: string) {
    setInviteeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await updateEvent(event.id, {
      title: title.trim().slice(0, 100),
      eventDate,
      description: description.trim().slice(0, 500) || null,
      recurring: recurringAnnual ? "annual" : "none",
      category,
      inviteeIds,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved();
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" aria-hidden onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-event-title"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 id="edit-event-title" className="font-display text-lg font-semibold text-[var(--foreground)]">
              Edit event
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-event-title-input" className="block text-sm font-medium text-[var(--muted)]">
                What are we celebrating? *
              </label>
              <input
                id="edit-event-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
                className="input-base mt-1"
              />
            </div>
            <div>
              <label htmlFor="edit-event-date" className="block text-sm font-medium text-[var(--muted)]">
                When is it? *
              </label>
              <input
                id="edit-event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="input-base mt-1"
              />
            </div>
            <div>
              <label htmlFor="edit-event-category" className="block text-sm font-medium text-[var(--muted)]">
                Event type *
              </label>
              <select
                id="edit-event-category"
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
              <label className="block text-sm font-medium text-[var(--muted)]">Add details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                className="input-base mt-1 min-h-[80px] resize-y"
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-[var(--muted)]">Who&apos;s involved?</span>
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
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="btn-submit rounded-full bg-[var(--primary)] font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Saving…" : "Save changes"}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)]">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
