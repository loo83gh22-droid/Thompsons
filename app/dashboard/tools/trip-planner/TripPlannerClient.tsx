"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createTrip } from "./actions";

type Member = { id: string; name: string; role: string };

type Trip = {
  id: string;
  name: string;
  description: string | null;
  destination: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  created_at: string;
};

const STATUS_BADGE: Record<string, string> = {
  planning: "bg-amber-100 text-amber-700",
  booked: "bg-blue-100 text-blue-700",
  in_progress: "bg-emerald-100 text-emerald-700",
  completed: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  booked: "Booked",
  in_progress: "In Progress",
  completed: "Completed",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TripPlannerClient({
  currentMember,
  trips,
}: {
  currentMember: Member;
  trips: Trip[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canCreate =
    currentMember.role === "owner" || currentMember.role === "adult";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function handleCreate() {
    if (!name.trim() || !startDate) return;
    startTransition(async () => {
      await createTrip({
        name,
        description: description || undefined,
        destination: destination || undefined,
        startDate,
        endDate: endDate || undefined,
      });
      setName("");
      setDescription("");
      setDestination("");
      setStartDate("");
      setEndDate("");
      setShowForm(false);
    });
  }

  const today = new Date().toISOString().split("T")[0];
  const upcoming = trips.filter(
    (t) =>
      t.status !== "completed" &&
      t.start_date >= today
  );
  const past = trips.filter(
    (t) => t.status === "completed" || t.start_date < today
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Trip Planner
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Plan family trips, build itineraries, and keep track of packing
            lists.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            + New Trip
          </button>
        )}
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold">
              Plan a New Trip
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">
                  Trip name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Family Road Trip 2026"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">
                  Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Banff, Alberta"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What's the plan?"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)]">
                    Start date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)]">
                    End date
                  </label>
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
                disabled={isPending || !name.trim() || !startDate}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create Trip"}
              </button>
            </div>
          </div>
        </div>
      )}

      {trips.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
          <p className="text-4xl">✈️</p>
          <h2 className="mt-4 font-display text-lg font-semibold">
            No trips planned yet
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Start planning your next family adventure! Add destinations,
            itineraries, and packing lists all in one place.
          </p>
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              + Plan a Trip
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
                {upcoming.map((t) => (
                  <TripCard key={t.id} trip={t} />
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
                {past.map((t) => (
                  <TripCard key={t.id} trip={t} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const dateStr = trip.end_date
    ? `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`
    : formatDate(trip.start_date);

  return (
    <Link
      href={`/dashboard/tools/trip-planner/${trip.id}`}
      className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:border-[var(--accent)]/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold group-hover:text-[var(--accent)]">
          {trip.name}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATUS_BADGE[trip.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {STATUS_LABEL[trip.status] ?? trip.status}
        </span>
      </div>

      <p className="mt-1 text-sm text-[var(--muted)]">{dateStr}</p>

      {trip.destination && (
        <p className="mt-1 text-sm text-[var(--muted)]">
          <span className="mr-1">📍</span>
          {trip.destination}
        </p>
      )}

      {trip.description && (
        <p className="mt-2 line-clamp-2 text-sm text-[var(--foreground)]/80">
          {trip.description}
        </p>
      )}
    </Link>
  );
}
