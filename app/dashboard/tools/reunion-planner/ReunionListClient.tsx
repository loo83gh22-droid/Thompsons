"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createReunion } from "./actions";

type Member = { id: string; name: string; role: string };

type Reunion = {
  id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  created_by_member: { id: string; name: string; nickname?: string | null } | null;
};

type RsvpCounts = Record<string, { attending: number; maybe: number; declined: number }>;

const STATUS_BADGE: Record<string, string> = {
  planning: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ReunionListClient({
  currentMember,
  reunions,
  rsvpCounts,
}: {
  currentMember: Member;
  reunions: Reunion[];
  rsvpCounts: RsvpCounts;
}) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canCreate = currentMember.role === "owner" || currentMember.role === "adult";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function handleCreate() {
    if (!title.trim() || !startDate) return;
    startTransition(async () => {
      await createReunion({
        title,
        description: description || undefined,
        locationName: locationName || undefined,
        startDate,
        endDate: endDate || undefined,
        createdBy: currentMember.id,
      });
      setTitle("");
      setDescription("");
      setLocationName("");
      setStartDate("");
      setEndDate("");
      setShowForm(false);
    });
  }

  // Split into upcoming and past
  const today = new Date().toISOString().split("T")[0];
  const upcoming = reunions.filter(
    (r) => r.status !== "completed" && r.status !== "cancelled" && r.start_date >= today
  );
  const past = reunions.filter(
    (r) => r.status === "completed" || r.status === "cancelled" || r.start_date < today
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Reunion Planner</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Plan your next family gathering and keep everyone in the loop.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            + New Reunion
          </button>
        )}
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold">Plan a New Reunion</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summer BBQ 2026"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What's the occasion?"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">Location</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Grandma's house, Lakeside Park..."
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)]">Start date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)]">End date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isPending || !title.trim() || !startDate}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create Reunion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {reunions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
          <p className="text-4xl">🎉</p>
          <h2 className="mt-4 font-display text-lg font-semibold">No reunions planned yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Start planning your first family reunion and get everyone excited!
          </p>
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              + Plan a Reunion
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
                Upcoming
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((r) => (
                  <ReunionCard key={r.id} reunion={r} counts={rsvpCounts[r.id]} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
                Past
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {past.map((r) => (
                  <ReunionCard key={r.id} reunion={r} counts={rsvpCounts[r.id]} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReunionCard({
  reunion,
  counts,
}: {
  reunion: Reunion;
  counts?: { attending: number; maybe: number; declined: number };
}) {
  const dateStr = reunion.end_date
    ? `${formatDate(reunion.start_date)} - ${formatDate(reunion.end_date)}`
    : formatDate(reunion.start_date);

  return (
    <Link
      href={`/dashboard/tools/reunion-planner/${reunion.id}`}
      className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:border-[var(--accent)]/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold group-hover:text-[var(--accent)]">
          {reunion.title}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[reunion.status] ?? "bg-gray-100 text-gray-600"}`}
        >
          {STATUS_LABEL[reunion.status] ?? reunion.status}
        </span>
      </div>

      <p className="mt-1 text-sm text-[var(--muted)]">{dateStr}</p>

      {reunion.location_name && (
        <p className="mt-1 text-sm text-[var(--muted)]">
          <span className="mr-1">📍</span>
          {reunion.location_name}
        </p>
      )}

      {reunion.description && (
        <p className="mt-2 line-clamp-2 text-sm text-[var(--foreground)]/80">
          {reunion.description}
        </p>
      )}

      {counts && (counts.attending > 0 || counts.maybe > 0) && (
        <div className="mt-3 flex gap-3 text-xs text-[var(--muted)]">
          {counts.attending > 0 && (
            <span className="text-emerald-600">{counts.attending} attending</span>
          )}
          {counts.maybe > 0 && (
            <span className="text-amber-600">{counts.maybe} maybe</span>
          )}
        </div>
      )}
    </Link>
  );
}
