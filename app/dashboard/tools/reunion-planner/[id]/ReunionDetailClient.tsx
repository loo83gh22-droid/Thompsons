"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateReunion,
  updateReunionStatus,
  deleteReunion,
  upsertRsvp,
} from "../actions";
import type { ReunionStatus, RsvpStatus } from "../actions";

type Member = { id: string; name: string; nickname?: string | null; role: string };

type Reunion = {
  id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  start_date: string;
  end_date: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  created_by_member: { id: string; name: string; nickname?: string | null } | null;
};

type Rsvp = {
  id: string;
  reunion_id: string;
  member_id: string;
  status: string;
  plus_ones: number;
  dietary_notes: string | null;
  notes: string | null;
  responded_at: string | null;
};

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

const RSVP_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  attending: { bg: "bg-emerald-100 hover:bg-emerald-200 border-emerald-300", text: "text-emerald-700", label: "Attending" },
  maybe: { bg: "bg-amber-100 hover:bg-amber-200 border-amber-300", text: "text-amber-700", label: "Maybe" },
  declined: { bg: "bg-red-100 hover:bg-red-200 border-red-300", text: "text-red-700", label: "Can't Make It" },
  pending: { bg: "bg-gray-100 border-gray-200", text: "text-gray-500", label: "No Response" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function displayName(m: { name: string; nickname?: string | null } | null) {
  if (!m) return "Someone";
  return m.nickname?.trim() || m.name;
}

export function ReunionDetailClient({
  reunion,
  currentMember,
  allMembers,
  rsvps,
}: {
  reunion: Reunion;
  currentMember: Member;
  allMembers: Member[];
  rsvps: Rsvp[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"overview" | "rsvps">("overview");
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState(reunion.title);
  const [editDesc, setEditDesc] = useState(reunion.description ?? "");
  const [editLocation, setEditLocation] = useState(reunion.location_name ?? "");
  const [editStartDate, setEditStartDate] = useState(reunion.start_date);
  const [editEndDate, setEditEndDate] = useState(reunion.end_date ?? "");

  const isAdmin = currentMember.role === "owner" || currentMember.role === "adult";
  const myRsvp = rsvps.find((r) => r.member_id === currentMember.id);

  // RSVP counts
  const attending = rsvps.filter((r) => r.status === "attending");
  const maybe = rsvps.filter((r) => r.status === "maybe");
  const declined = rsvps.filter((r) => r.status === "declined");
  const totalHeadcount = attending.reduce((sum, r) => sum + 1 + r.plus_ones, 0);

  function handleSaveEdit() {
    startTransition(async () => {
      await updateReunion(reunion.id, {
        title: editTitle,
        description: editDesc,
        locationName: editLocation,
        startDate: editStartDate,
        endDate: editEndDate || null,
      });
      setEditing(false);
    });
  }

  function handleStatusChange(status: ReunionStatus) {
    startTransition(async () => {
      await updateReunionStatus(reunion.id, status);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteReunion(reunion.id);
      router.push("/dashboard/tools/reunion-planner");
    });
  }

  function handleRsvp(status: RsvpStatus) {
    startTransition(async () => {
      await upsertRsvp(reunion.id, {
        memberId: currentMember.id,
        status,
        plusOnes: myRsvp?.plus_ones ?? 0,
        dietaryNotes: myRsvp?.dietary_notes ?? undefined,
        notes: myRsvp?.notes ?? undefined,
      });
    });
  }

  function handleRsvpDetails(plusOnes: number, dietaryNotes: string, notes: string) {
    startTransition(async () => {
      await upsertRsvp(reunion.id, {
        memberId: currentMember.id,
        status: (myRsvp?.status as RsvpStatus) ?? "attending",
        plusOnes,
        dietaryNotes,
        notes,
      });
    });
  }

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "rsvps" as const, label: `RSVPs (${rsvps.length})` },
  ];

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/tools/reunion-planner"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <span>&#8592;</span> All Reunions
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{reunion.title}</h1>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[reunion.status] ?? "bg-gray-100"}`}>
              {STATUS_LABEL[reunion.status] ?? reunion.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {formatDate(reunion.start_date)}
            {reunion.end_date && ` - ${formatDate(reunion.end_date)}`}
          </p>
          {reunion.location_name && (
            <p className="mt-1 text-sm text-[var(--muted)]">
              <span className="mr-1">📍</span>{reunion.location_name}
            </p>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)]"
            >
              Edit
            </button>
            {reunion.status === "planning" && (
              <button
                type="button"
                onClick={() => handleStatusChange("confirmed")}
                disabled={isPending}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Confirm
              </button>
            )}
            {reunion.status === "confirmed" && (
              <button
                type="button"
                onClick={() => handleStatusChange("completed")}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Mark Complete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick RSVP bar */}
      <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="mb-3 text-sm font-medium">Your RSVP:</p>
        <div className="flex flex-wrap gap-2">
          {(["attending", "maybe", "declined"] as const).map((status) => {
            const style = RSVP_STYLES[status];
            const isSelected = myRsvp?.status === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleRsvp(status)}
                disabled={isPending}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  isSelected
                    ? `${style.bg} ${style.text} border-current ring-2 ring-current/20`
                    : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                {style.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Headcount summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{attending.length}</p>
          <p className="text-xs text-[var(--muted)]">Attending</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{maybe.length}</p>
          <p className="text-xs text-[var(--muted)]">Maybe</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{declined.length}</p>
          <p className="text-xs text-[var(--muted)]">Declined</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
          <p className="text-2xl font-bold text-[var(--foreground)]">{totalHeadcount}</p>
          <p className="text-xs text-[var(--muted)]">Headcount</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab
          reunion={reunion}
          rsvps={rsvps}
          allMembers={allMembers}
          isAdmin={isAdmin}
          onDelete={() => setShowDeleteConfirm(true)}
        />
      )}

      {activeTab === "rsvps" && (
        <RsvpsTab
          rsvps={rsvps}
          allMembers={allMembers}
          currentMember={currentMember}
          myRsvp={myRsvp}
          isPending={isPending}
          onRsvpDetails={handleRsvpDetails}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold">Edit Reunion</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)]">Start date</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)]">End date</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isPending || !editTitle.trim() || !editStartDate}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold">Delete Reunion?</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This will permanently delete &quot;{reunion.title}&quot; and all RSVPs. This can&apos;t be undone.
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
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab({
  reunion,
  rsvps,
  allMembers,
  isAdmin,
  onDelete,
}: {
  reunion: Reunion;
  rsvps: Rsvp[];
  allMembers: Member[];
  isAdmin: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-6">
      {reunion.description && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">About</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{reunion.description}</p>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">Details</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Date</dt>
            <dd>
              {formatDate(reunion.start_date)}
              {reunion.end_date && ` - ${formatDate(reunion.end_date)}`}
            </dd>
          </div>
          {reunion.location_name && (
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Location</dt>
              <dd>{reunion.location_name}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Organized by</dt>
            <dd>{displayName(reunion.created_by_member)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Status</dt>
            <dd>{STATUS_LABEL[reunion.status]}</dd>
          </div>
        </dl>
      </div>

      {/* Who hasn't responded */}
      {(() => {
        const respondedIds = new Set(rsvps.map((r) => r.member_id));
        const noResponse = allMembers.filter((m) => !respondedIds.has(m.id));
        if (noResponse.length === 0) return null;
        return (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
              Awaiting Response ({noResponse.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {noResponse.map((m) => (
                <span key={m.id} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {displayName(m)}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Dietary notes summary */}
      {(() => {
        const withDietary = rsvps.filter((r) => r.dietary_notes?.trim());
        if (withDietary.length === 0) return null;
        return (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
              Dietary Notes
            </h3>
            <ul className="space-y-2 text-sm">
              {withDietary.map((r) => {
                const member = allMembers.find((m) => m.id === r.member_id);
                return (
                  <li key={r.id}>
                    <span className="font-medium">{displayName(member ?? null)}:</span>{" "}
                    {r.dietary_notes}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })()}

      {isAdmin && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h3 className="mb-2 text-sm font-semibold text-red-700">Danger Zone</h3>
          <p className="mb-3 text-sm text-red-600">
            Permanently delete this reunion and all associated RSVPs.
          </p>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Delete Reunion
          </button>
        </div>
      )}
    </div>
  );
}

// ── RSVPs Tab ──────────────────────────────────────────────────────────────────

function RsvpsTab({
  rsvps,
  allMembers,
  currentMember,
  myRsvp,
  isPending,
  onRsvpDetails,
}: {
  rsvps: Rsvp[];
  allMembers: Member[];
  currentMember: Member;
  myRsvp: Rsvp | undefined;
  isPending: boolean;
  onRsvpDetails: (plusOnes: number, dietaryNotes: string, notes: string) => void;
}) {
  const [editingDetails, setEditingDetails] = useState(false);
  const [plusOnes, setPlusOnes] = useState(myRsvp?.plus_ones ?? 0);
  const [dietaryNotes, setDietaryNotes] = useState(myRsvp?.dietary_notes ?? "");
  const [notes, setNotes] = useState(myRsvp?.notes ?? "");

  function handleSaveDetails() {
    onRsvpDetails(plusOnes, dietaryNotes, notes);
    setEditingDetails(false);
  }

  // Build full member list with RSVP status
  const rsvpMap = new Map(rsvps.map((r) => [r.member_id, r]));
  const memberRsvps = allMembers.map((m) => ({
    member: m,
    rsvp: rsvpMap.get(m.id),
  }));

  // Sort: attending first, then maybe, then no response, then declined
  const sortOrder: Record<string, number> = { attending: 0, maybe: 1, pending: 2, declined: 3 };
  memberRsvps.sort((a, b) => {
    const aOrder = sortOrder[a.rsvp?.status ?? "pending"] ?? 2;
    const bOrder = sortOrder[b.rsvp?.status ?? "pending"] ?? 2;
    return aOrder - bOrder;
  });

  return (
    <div className="space-y-6">
      {/* My RSVP details */}
      {myRsvp && myRsvp.status !== "declined" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
              Your Details
            </h3>
            {!editingDetails && (
              <button
                type="button"
                onClick={() => setEditingDetails(true)}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                Edit
              </button>
            )}
          </div>
          {editingDetails ? (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">
                  Plus ones (extra guests)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={plusOnes}
                  onChange={(e) => setPlusOnes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="mt-1 w-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">
                  Dietary notes
                </label>
                <input
                  type="text"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="Vegetarian, nut allergy..."
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Arriving late, bringing the dog..."
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  disabled={isPending}
                  className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDetails(false)}
                  className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-1 text-sm">
              {myRsvp.plus_ones > 0 && (
                <p>Bringing {myRsvp.plus_ones} guest{myRsvp.plus_ones > 1 ? "s" : ""}</p>
              )}
              {myRsvp.dietary_notes && <p>Diet: {myRsvp.dietary_notes}</p>}
              {myRsvp.notes && <p>Note: {myRsvp.notes}</p>}
              {!myRsvp.plus_ones && !myRsvp.dietary_notes && !myRsvp.notes && (
                <p className="text-[var(--muted)]">No additional details added yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* All RSVPs */}
      <div className="space-y-2">
        {memberRsvps.map(({ member, rsvp }) => {
          const status = rsvp?.status ?? "pending";
          const style = RSVP_STYLES[status] ?? RSVP_STYLES.pending;
          const isMe = member.id === currentMember.id;
          return (
            <div
              key={member.id}
              className={`flex items-center justify-between rounded-lg border ${
                isMe ? "border-[var(--accent)]/30 bg-[var(--accent)]/5" : "border-[var(--border)] bg-[var(--surface)]"
              } px-4 py-3`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-medium text-[var(--accent)]">
                  {(member.nickname?.trim() || member.name).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {displayName(member)}
                    {isMe && <span className="ml-1 text-xs text-[var(--muted)]">(you)</span>}
                  </p>
                  {rsvp?.plus_ones ? (
                    <p className="text-xs text-[var(--muted)]">
                      +{rsvp.plus_ones} guest{rsvp.plus_ones > 1 ? "s" : ""}
                    </p>
                  ) : null}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.text}`}>
                {style.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
