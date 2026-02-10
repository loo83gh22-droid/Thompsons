"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEvent } from "./actions";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  recurring: string;
  category: string;
  family_members: { name: string } | { name: string }[] | null;
};

export function EventsList({ events }: { events: EventRow[] }) {
  const router = useRouter();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    setDeletingId(id);
    await deleteEvent(id);
    setDeletingId(null);
    router.refresh();
  }

  const byMonth = events.reduce<Record<string, EventRow[]>>((acc, e) => {
    const key = e.event_date.slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});
  const months = Object.keys(byMonth).sort();

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "list" ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "hover:bg-[var(--surface)]"}`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "calendar" ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "hover:bg-[var(--surface)]"}`}
        >
          By month
        </button>
      </div>

      {view === "list" && (
        <ul className="space-y-3">
          {events.map((e) => {
            const creator = Array.isArray(e.family_members) ? e.family_members[0] : e.family_members;
            return (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div>
                  <span className="font-medium text-[var(--foreground)]">{e.title}</span>
                  <span className="ml-2 text-sm text-[var(--muted)]">{e.event_date}</span>
                  {e.recurring !== "none" && <span className="ml-2 text-xs text-[var(--muted)]">({e.recurring})</span>}
                  {e.description && <p className="mt-1 text-sm text-[var(--muted)]">{e.description}</p>}
                  {creator?.name && <p className="text-xs text-[var(--muted)]">Added by {creator.name}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(e.id)}
                  disabled={deletingId === e.id}
                  className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  {deletingId === e.id ? "..." : "Delete"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {view === "calendar" && (
        <div className="space-y-6">
          {months.map((monthKey) => {
            const [y, m] = monthKey.split("-").map(Number);
            const monthName = new Date(y, m - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
            return (
              <section key={monthKey}>
                <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">{monthName}</h3>
                <ul className="mt-2 space-y-2">
                  {(byMonth[monthKey] ?? []).map((e) => (
                    <li key={e.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2">
                      <span className="font-medium text-[var(--foreground)]">{e.title}</span>
                      <span className="text-sm text-[var(--muted)]">{e.event_date}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
