"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateTripStatus,
  deleteTrip,
  addItineraryItem,
  deleteItineraryItem,
  addPackingItem,
  togglePackingItem,
  deletePackingItem,
} from "../actions";
import type { TripStatus } from "../actions";

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

type Member = { id: string; name: string; role: string };
type FamilyMember = { id: string; name: string; nickname: string | null };

type ItineraryItem = {
  id: string;
  trip_id: string;
  day_date: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  sort_order: number;
};

type PackingItem = {
  id: string;
  trip_id: string;
  item_name: string;
  assigned_to: string | null;
  is_packed: boolean;
  category: string;
  assigned_member: { id: string; name: string; nickname: string | null } | null;
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

const STATUS_FLOW: TripStatus[] = [
  "planning",
  "booked",
  "in_progress",
  "completed",
];

const PACKING_CATEGORIES = [
  "Clothes",
  "Toiletries",
  "Electronics",
  "Documents",
  "Other",
];

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${ampm}`;
}

export function TripDetailClient({
  trip,
  currentMember,
  familyMembers,
  itineraryItems,
  packingItems,
}: {
  trip: Trip;
  currentMember: Member;
  familyMembers: FamilyMember[];
  itineraryItems: ItineraryItem[];
  packingItems: PackingItem[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"itinerary" | "packing">(
    "itinerary"
  );
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const canManage =
    currentMember.role === "owner" || currentMember.role === "adult";

  function handleStatusChange(status: TripStatus) {
    startTransition(async () => {
      await updateTripStatus(trip.id, status);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTrip(trip.id);
      router.push("/dashboard/tools/trip-planner");
    });
  }

  const dateStr = trip.end_date
    ? `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`
    : formatDate(trip.start_date);

  // Group itinerary by date
  const itineraryByDate: Record<string, ItineraryItem[]> = {};
  for (const item of itineraryItems) {
    if (!itineraryByDate[item.day_date]) {
      itineraryByDate[item.day_date] = [];
    }
    itineraryByDate[item.day_date].push(item);
  }
  const sortedDates = Object.keys(itineraryByDate).sort();

  // Group packing by category
  const packingByCategory: Record<string, PackingItem[]> = {};
  for (const item of packingItems) {
    const cat = item.category || "Other";
    if (!packingByCategory[cat]) {
      packingByCategory[cat] = [];
    }
    packingByCategory[cat].push(item);
  }

  const totalPacking = packingItems.length;
  const packedCount = packingItems.filter((p) => p.is_packed).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/tools/trip-planner"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Back to trips
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              {trip.name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                STATUS_BADGE[trip.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {STATUS_LABEL[trip.status] ?? trip.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">{dateStr}</p>
          {trip.destination && (
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              📍 {trip.destination}
            </p>
          )}
          {trip.description && (
            <p className="mt-2 text-sm text-[var(--foreground)]/80">
              {trip.description}
            </p>
          )}
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Status buttons */}
            <select
              value={trip.status}
              onChange={(e) =>
                handleStatusChange(e.target.value as TripStatus)
              }
              disabled={isPending}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            >
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold">
              Delete this trip?
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This will permanently delete the trip, including all itinerary
              items and packing lists. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete Trip"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[var(--surface)] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("itinerary")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "itinerary"
              ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Itinerary
          {itineraryItems.length > 0 && (
            <span className="ml-1.5 text-xs text-[var(--muted)]">
              ({itineraryItems.length})
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("packing")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "packing"
              ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Packing List
          {totalPacking > 0 && (
            <span className="ml-1.5 text-xs text-[var(--muted)]">
              ({packedCount}/{totalPacking})
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "itinerary" ? (
        <ItineraryTab
          tripId={trip.id}
          items={itineraryItems}
          itineraryByDate={itineraryByDate}
          sortedDates={sortedDates}
          canManage={canManage}
        />
      ) : (
        <PackingTab
          tripId={trip.id}
          items={packingItems}
          packingByCategory={packingByCategory}
          familyMembers={familyMembers}
          canManage={canManage}
          currentMember={currentMember}
        />
      )}
    </div>
  );
}

// ── Itinerary Tab ──────────────────────────────────────────────────────

function ItineraryTab({
  tripId,
  items,
  itineraryByDate,
  sortedDates,
  canManage,
}: {
  tripId: string;
  items: ItineraryItem[];
  itineraryByDate: Record<string, ItineraryItem[]>;
  sortedDates: string[];
  canManage: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [dayDate, setDayDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  function handleAdd() {
    if (!dayDate || !title.trim()) return;
    startTransition(async () => {
      await addItineraryItem({
        tripId,
        dayDate,
        title,
        description: description || undefined,
        location: location || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      });
      setTitle("");
      setDescription("");
      setLocation("");
      setStartTime("");
      setEndTime("");
      setShowForm(false);
    });
  }

  function handleDeleteItem(itemId: string) {
    startTransition(async () => {
      await deleteItineraryItem(tripId, itemId);
    });
  }

  return (
    <div>
      {canManage && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            + Add Activity
          </button>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="text-sm font-semibold">New Activity</h3>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Date *
                </label>
                <input
                  type="date"
                  value={dayDate}
                  onChange={(e) => setDayDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Visit the museum"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="123 Main St"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Any notes or details..."
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Start time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  End time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={isPending || !dayDate || !title.trim()}
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {isPending ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Itinerary list grouped by date */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-3xl">🗓️</p>
          <h3 className="mt-3 font-display text-base font-semibold">
            No activities yet
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add activities to build your day-by-day itinerary.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <h3 className="mb-3 text-sm font-semibold text-[var(--muted)]">
                {formatDate(date)}
              </h3>
              <div className="space-y-2">
                {itineraryByDate[date].map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-medium">{item.title}</h4>
                          {(item.start_time || item.end_time) && (
                            <span className="text-xs text-[var(--muted)]">
                              {item.start_time && formatTime(item.start_time)}
                              {item.start_time && item.end_time && " - "}
                              {item.end_time && formatTime(item.end_time)}
                            </span>
                          )}
                        </div>
                        {item.location && (
                          <p className="mt-0.5 text-sm text-[var(--muted)]">
                            📍 {item.location}
                          </p>
                        )}
                        {item.description && (
                          <p className="mt-1 text-sm text-[var(--foreground)]/70">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={isPending}
                          className="shrink-0 rounded-md p-1 text-[var(--muted)] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Packing Tab ────────────────────────────────────────────────────────

function PackingTab({
  tripId,
  items,
  packingByCategory,
  familyMembers,
  canManage,
  currentMember,
}: {
  tripId: string;
  items: PackingItem[];
  packingByCategory: Record<string, PackingItem[]>;
  familyMembers: FamilyMember[];
  canManage: boolean;
  currentMember: Member;
}) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Other");
  const [assignedTo, setAssignedTo] = useState("");

  const canToggle =
    currentMember.role === "owner" ||
    currentMember.role === "adult" ||
    currentMember.role === "teen";

  function handleAdd() {
    if (!itemName.trim()) return;
    startTransition(async () => {
      await addPackingItem({
        tripId,
        itemName,
        category,
        assignedTo: assignedTo || undefined,
      });
      setItemName("");
    });
  }

  function handleToggle(itemId: string, currentVal: boolean) {
    startTransition(async () => {
      await togglePackingItem(tripId, itemId, !currentVal);
    });
  }

  function handleDeleteItem(itemId: string) {
    startTransition(async () => {
      await deletePackingItem(tripId, itemId);
    });
  }

  const totalItems = items.length;
  const packedCount = items.filter((p) => p.is_packed).length;
  const progressPct = totalItems > 0 ? (packedCount / totalItems) * 100 : 0;

  return (
    <div>
      {/* Progress bar */}
      {totalItems > 0 && (
        <div className="mb-6">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-[var(--muted)]">Packing progress</span>
            <span className="font-medium">
              {packedCount} / {totalItems} packed
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface)]">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Add form */}
      {(canManage || canToggle) && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            + Add Item
          </button>
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="text-sm font-semibold">New Packing Item</h3>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Item *
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Sunscreen"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                  }}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  {PACKING_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Assigned to
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="">Anyone</option>
                  {familyMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nickname || m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              >
                Done
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={isPending || !itemName.trim()}
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {isPending ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Packing list grouped by category */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-3xl">🎒</p>
          <h3 className="mt-3 font-display text-base font-semibold">
            Packing list is empty
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Start adding items so nobody forgets the essentials.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {PACKING_CATEGORIES.filter((cat) => packingByCategory[cat]?.length).map(
            (cat) => (
              <div key={cat}>
                <h3 className="mb-2 text-sm font-semibold text-[var(--muted)]">
                  {cat}
                </h3>
                <div className="space-y-1">
                  {packingByCategory[cat].map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id, item.is_packed)}
                        disabled={isPending || !canToggle}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                          item.is_packed
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-[var(--border)] hover:border-[var(--accent)]"
                        }`}
                      >
                        {item.is_packed && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          item.is_packed
                            ? "text-[var(--muted)] line-through"
                            : ""
                        }`}
                      >
                        {item.item_name}
                      </span>
                      {item.assigned_member && (
                        <span className="text-xs text-[var(--muted)]">
                          {item.assigned_member.nickname ||
                            item.assigned_member.name}
                        </span>
                      )}
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={isPending}
                          className="shrink-0 rounded-md p-1 text-[var(--muted)] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
          {/* Show any items in categories not in PACKING_CATEGORIES */}
          {Object.keys(packingByCategory)
            .filter((cat) => !PACKING_CATEGORIES.includes(cat))
            .map((cat) => (
              <div key={cat}>
                <h3 className="mb-2 text-sm font-semibold text-[var(--muted)]">
                  {cat}
                </h3>
                <div className="space-y-1">
                  {packingByCategory[cat].map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id, item.is_packed)}
                        disabled={isPending || !canToggle}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                          item.is_packed
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-[var(--border)] hover:border-[var(--accent)]"
                        }`}
                      >
                        {item.is_packed && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          item.is_packed
                            ? "text-[var(--muted)] line-through"
                            : ""
                        }`}
                      >
                        {item.item_name}
                      </span>
                      {item.assigned_member && (
                        <span className="text-xs text-[var(--muted)]">
                          {item.assigned_member.nickname ||
                            item.assigned_member.name}
                        </span>
                      )}
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={isPending}
                          className="shrink-0 rounded-md p-1 text-[var(--muted)] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
