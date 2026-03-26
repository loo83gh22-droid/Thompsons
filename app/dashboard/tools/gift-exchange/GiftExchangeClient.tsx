"use client";

import { useState, useTransition } from "react";
import {
  createGiftExchange,
  updateGiftExchange,
  deleteGiftExchange,
  addParticipant,
  removeParticipant,
  drawNames,
  markExchangeCompleted,
  addWishlistItem,
  removeWishlistItem,
} from "./actions";

// ── Types ──────────────────────────────────────────────────────────
type Member = { id: string; name: string; role: string };
type FamilyMember = { id: string; name: string; nickname?: string | null };

type Exchange = {
  id: string;
  name: string;
  description: string | null;
  budget_limit: number | null;
  exchange_date: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type Participant = {
  id: string;
  exchange_id: string;
  member_id: string;
  assigned_to: string | null;
};

type WishlistItem = {
  id: string;
  exchange_id: string;
  member_id: string;
  item_name: string;
  item_url: string | null;
  notes: string | null;
  created_at: string;
};

// ── Helpers ────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  drawn: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  drawn: "Names Drawn",
  completed: "Completed",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function memberDisplayName(m: FamilyMember) {
  return m.nickname || m.name;
}

// ── Main component ─────────────────────────────────────────────────
export function GiftExchangeClient({
  currentMember,
  familyMembers,
  exchanges,
  participants,
  wishlistItems,
}: {
  currentMember: Member;
  familyMembers: FamilyMember[];
  exchanges: Exchange[];
  participants: Participant[];
  wishlistItems: WishlistItem[];
}) {
  const [selectedExchangeId, setSelectedExchangeId] = useState<string | null>(
    null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const canManage =
    currentMember.role === "owner" || currentMember.role === "adult";

  const selectedExchange = exchanges.find((e) => e.id === selectedExchangeId);

  if (selectedExchange) {
    const exchangeParticipants = participants.filter(
      (p) => p.exchange_id === selectedExchange.id
    );
    const exchangeWishlist = wishlistItems.filter(
      (w) => w.exchange_id === selectedExchange.id
    );
    return (
      <ExchangeDetail
        exchange={selectedExchange}
        currentMember={currentMember}
        familyMembers={familyMembers}
        participants={exchangeParticipants}
        wishlistItems={exchangeWishlist}
        canManage={canManage}
        onBack={() => setSelectedExchangeId(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Gift Exchange
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Organize Secret Santa draws, share wishlists, and keep the surprise
            alive.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            + New Exchange
          </button>
        )}
      </div>

      {showCreateForm && (
        <CreateExchangeModal
          familyMembers={familyMembers}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {exchanges.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
          <p className="text-4xl">🎁</p>
          <h2 className="mt-4 font-display text-lg font-semibold">
            No gift exchanges yet
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Create your first exchange and start adding participants. Perfect
            for holidays, birthdays, or any family gathering.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              + Create an Exchange
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {exchanges.map((exchange) => {
            const count = participants.filter(
              (p) => p.exchange_id === exchange.id
            ).length;
            return (
              <button
                key={exchange.id}
                type="button"
                onClick={() => setSelectedExchangeId(exchange.id)}
                className="group block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition-all hover:border-[var(--accent)]/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold group-hover:text-[var(--accent)]">
                    {exchange.name}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[exchange.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {STATUS_LABEL[exchange.status] ?? exchange.status}
                  </span>
                </div>

                {exchange.exchange_date && (
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {formatDate(exchange.exchange_date)}
                  </p>
                )}

                {exchange.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--foreground)]/80">
                    {exchange.description}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-4 text-xs text-[var(--muted)]">
                  <span>{count} participant{count !== 1 ? "s" : ""}</span>
                  {exchange.budget_limit && (
                    <span>Budget: ${Number(exchange.budget_limit).toFixed(0)}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Create Exchange Modal ──────────────────────────────────────────
function CreateExchangeModal({
  familyMembers,
  onClose,
}: {
  familyMembers: FamilyMember[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [exchangeDate, setExchangeDate] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  function toggleMember(id: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleCreate() {
    if (!name.trim()) return;
    startTransition(async () => {
      await createGiftExchange({
        name,
        description: description || undefined,
        budgetLimit: budgetLimit ? parseFloat(budgetLimit) : undefined,
        exchangeDate: exchangeDate || undefined,
        memberIds: selectedMemberIds,
      });
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl">
        <h2 className="font-display text-lg font-semibold">
          Create a Gift Exchange
        </h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Christmas 2026 Secret Santa"
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
              placeholder="What's the occasion?"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Budget limit
              </label>
              <input
                type="number"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                placeholder="50"
                min={0}
                step={5}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Exchange date
              </label>
              <input
                type="date"
                value={exchangeDate}
                onChange={(e) => setExchangeDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>
          {familyMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Participants
              </label>
              <div className="mt-1 space-y-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                {familyMembers.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-2 rounded py-1 hover:text-[var(--foreground)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(m.id)}
                      onChange={() => toggleMember(m.id)}
                      className="rounded border-[var(--border)]"
                    />
                    <span className="text-sm">{memberDisplayName(m)}</span>
                  </label>
                ))}
              </div>
              {selectedMemberIds.length > 0 && (
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {selectedMemberIds.length} participant{selectedMemberIds.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending || !name.trim()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Exchange"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Exchange Detail View ───────────────────────────────────────────
function ExchangeDetail({
  exchange,
  currentMember,
  familyMembers,
  participants,
  wishlistItems,
  canManage,
  onBack,
}: {
  exchange: Exchange;
  currentMember: Member;
  familyMembers: FamilyMember[];
  participants: Participant[];
  wishlistItems: WishlistItem[];
  canManage: boolean;
  onBack: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "participants" | "my-wishlist" | "assignment"
  >("participants");

  const isParticipant = participants.some(
    (p) => p.member_id === currentMember.id
  );
  const myAssignment = participants.find(
    (p) => p.member_id === currentMember.id
  );
  const assignedMember = myAssignment?.assigned_to
    ? familyMembers.find((m) => m.id === myAssignment.assigned_to)
    : null;

  // Wishlist for the person I'm assigned to buy for
  const assignmentWishlist = myAssignment?.assigned_to
    ? wishlistItems.filter((w) => w.member_id === myAssignment.assigned_to)
    : [];

  // My wishlist items
  const myWishlistItems = wishlistItems.filter(
    (w) => w.member_id === currentMember.id
  );

  // Members not yet added as participants
  const availableMembers = familyMembers.filter(
    (m) => !participants.some((p) => p.member_id === m.id)
  );

  function handleDraw() {
    setDrawError(null);
    startTransition(async () => {
      try {
        await drawNames(exchange.id);
      } catch (err: unknown) {
        setDrawError(
          err instanceof Error ? err.message : "Failed to draw names."
        );
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteGiftExchange(exchange.id);
      onBack();
    });
  }

  function handleComplete() {
    startTransition(async () => {
      await markExchangeCompleted(exchange.id);
    });
  }

  function handleAddParticipant(memberId: string) {
    startTransition(async () => {
      await addParticipant(exchange.id, memberId);
    });
  }

  function handleRemoveParticipant(memberId: string) {
    startTransition(async () => {
      await removeParticipant(exchange.id, memberId);
    });
  }

  const tabs = [
    { key: "participants" as const, label: "Participants" },
    ...(isParticipant
      ? [{ key: "my-wishlist" as const, label: "My Wishlist" }]
      : []),
    ...(isParticipant && exchange.status !== "open"
      ? [{ key: "assignment" as const, label: "My Assignment" }]
      : []),
  ];

  return (
    <div>
      {/* Header */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        &larr; Back to all exchanges
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              {exchange.name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[exchange.status] ?? "bg-gray-100 text-gray-600"}`}
            >
              {STATUS_LABEL[exchange.status] ?? exchange.status}
            </span>
          </div>
          {exchange.description && (
            <p className="mt-1 text-sm text-[var(--foreground)]/80">
              {exchange.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
            {exchange.exchange_date && (
              <span>Date: {formatDate(exchange.exchange_date)}</span>
            )}
            {exchange.budget_limit && (
              <span>Budget: ${Number(exchange.budget_limit).toFixed(0)}</span>
            )}
          </div>
        </div>

        {canManage && exchange.status !== "completed" && (
          <div className="flex gap-2">
            {exchange.status === "open" && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
              >
                Edit
              </button>
            )}
            {exchange.status === "open" && participants.length >= 3 && (
              <button
                type="button"
                onClick={handleDraw}
                disabled={isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {isPending ? "Drawing..." : "Draw Names"}
              </button>
            )}
            {exchange.status === "drawn" && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Mark Completed"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {drawError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {drawError}
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && (
        <EditExchangeModal
          exchange={exchange}
          familyMembers={familyMembers}
          participants={participants}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl">
            <h3 className="font-display text-lg font-semibold">
              Delete this exchange?
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This will remove the exchange, all participants, and all wishlist
              items. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
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
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[var(--surface)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "participants" && (
        <ParticipantsTab
          exchange={exchange}
          participants={participants}
          familyMembers={familyMembers}
          availableMembers={availableMembers}
          canManage={canManage}
          isPending={isPending}
          onAdd={handleAddParticipant}
          onRemove={handleRemoveParticipant}
        />
      )}

      {activeTab === "my-wishlist" && (
        <MyWishlistTab
          exchangeId={exchange.id}
          items={myWishlistItems}
          exchangeStatus={exchange.status}
        />
      )}

      {activeTab === "assignment" && (
        <AssignmentTab
          assignedMember={assignedMember}
          wishlistItems={assignmentWishlist}
          exchangeStatus={exchange.status}
        />
      )}
    </div>
  );
}

// ── Edit Exchange Modal ────────────────────────────────────────────
function EditExchangeModal({
  exchange,
  familyMembers,
  participants,
  onClose,
}: {
  exchange: Exchange;
  familyMembers: FamilyMember[];
  participants: Participant[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(exchange.name);
  const [description, setDescription] = useState(exchange.description ?? "");
  const [budgetLimit, setBudgetLimit] = useState(
    exchange.budget_limit != null ? String(exchange.budget_limit) : ""
  );
  const [exchangeDate, setExchangeDate] = useState(exchange.exchange_date ?? "");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    participants.map((p) => p.member_id)
  );

  function toggleMember(id: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSave() {
    if (!name.trim()) return;
    startTransition(async () => {
      await updateGiftExchange(exchange.id, {
        name,
        description: description || undefined,
        budgetLimit: budgetLimit ? parseFloat(budgetLimit) : null,
        exchangeDate: exchangeDate || null,
        memberIds: selectedMemberIds,
      });
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl">
        <h2 className="font-display text-lg font-semibold">Edit Exchange</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Budget limit
              </label>
              <input
                type="number"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                placeholder="50"
                min={0}
                step={5}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Exchange date
              </label>
              <input
                type="date"
                value={exchangeDate}
                onChange={(e) => setExchangeDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>
          {familyMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Participants
              </label>
              <div className="mt-1 space-y-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                {familyMembers.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-2 rounded py-1 hover:text-[var(--foreground)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(m.id)}
                      onChange={() => toggleMember(m.id)}
                      className="rounded border-[var(--border)]"
                    />
                    <span className="text-sm">{memberDisplayName(m)}</span>
                  </label>
                ))}
              </div>
              {selectedMemberIds.length > 0 && (
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {selectedMemberIds.length} participant{selectedMemberIds.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !name.trim()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Participants Tab ───────────────────────────────────────────────
function ParticipantsTab({
  exchange,
  participants,
  familyMembers,
  availableMembers,
  canManage,
  isPending,
  onAdd,
  onRemove,
}: {
  exchange: Exchange;
  participants: Participant[];
  familyMembers: FamilyMember[];
  availableMembers: FamilyMember[];
  canManage: boolean;
  isPending: boolean;
  onAdd: (memberId: string) => void;
  onRemove: (memberId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Current participants */}
      {participants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-sm text-[var(--muted)]">
            No participants yet. Add family members to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {participants.map((p) => {
            const member = familyMembers.find((m) => m.id === p.member_id);
            if (!member) return null;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
              >
                <span className="text-sm font-medium">
                  {memberDisplayName(member)}
                </span>
                {canManage && exchange.status === "open" && (
                  <button
                    type="button"
                    onClick={() => onRemove(p.member_id)}
                    disabled={isPending}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add participants */}
      {canManage && exchange.status === "open" && availableMembers.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-[var(--muted)]">
            Add participants
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableMembers.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onAdd(m.id)}
                disabled={isPending}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
              >
                + {memberDisplayName(m)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Draw hint */}
      {exchange.status === "open" && participants.length > 0 && participants.length < 3 && (
        <p className="text-sm text-[var(--muted)]">
          You need at least 3 participants to draw names.
        </p>
      )}
    </div>
  );
}

// ── My Wishlist Tab ────────────────────────────────────────────────
function MyWishlistTab({
  exchangeId,
  items,
  exchangeStatus,
}: {
  exchangeId: string;
  items: WishlistItem[];
  exchangeStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemUrl, setItemUrl] = useState("");
  const [notes, setNotes] = useState("");

  function handleAdd() {
    if (!itemName.trim()) return;
    startTransition(async () => {
      await addWishlistItem({
        exchangeId,
        itemName,
        itemUrl: itemUrl || undefined,
        notes: notes || undefined,
      });
      setItemName("");
      setItemUrl("");
      setNotes("");
      setShowForm(false);
    });
  }

  function handleRemove(itemId: string) {
    startTransition(async () => {
      await removeWishlistItem(itemId);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--muted)]">
          Your wishlist items
        </h3>
        {exchangeStatus !== "completed" && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            + Add Item
          </button>
        )}
      </div>

      {items.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-sm text-[var(--muted)]">
            Your wishlist is empty. Add some ideas so your Secret Santa knows
            what to get you!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.item_name}</p>
                  {item.item_url && (
                    <a
                      href={item.item_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block truncate text-xs text-[var(--accent)] hover:underline"
                    >
                      {item.item_url}
                    </a>
                  )}
                  {item.notes && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {item.notes}
                    </p>
                  )}
                </div>
                {exchangeStatus !== "completed" && (
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    disabled={isPending}
                    className="shrink-0 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add item form */}
      {showForm && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Item name *
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Cozy wool socks"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Link (optional)
              </label>
              <input
                type="url"
                value={itemUrl}
                onChange={(e) => setItemUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Notes (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Size medium, prefer blue"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || !itemName.trim()}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {isPending ? "Adding..." : "Add to Wishlist"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Assignment Tab ─────────────────────────────────────────────────
function AssignmentTab({
  assignedMember,
  wishlistItems,
  exchangeStatus,
}: {
  assignedMember: FamilyMember | null | undefined;
  wishlistItems: WishlistItem[];
  exchangeStatus: string;
}) {
  if (!assignedMember) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
        <p className="text-sm text-[var(--muted)]">
          Names haven&apos;t been drawn yet, or you don&apos;t have an
          assignment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <p className="text-sm text-[var(--muted)]">You are buying a gift for</p>
        <p className="mt-2 font-display text-2xl font-bold text-[var(--accent)]">
          {memberDisplayName(assignedMember)}
        </p>
        {exchangeStatus === "completed" && (
          <p className="mt-2 text-sm text-emerald-600 font-medium">
            Exchange complete! Hope it was a great one.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-[var(--muted)]">
          Their wishlist
        </h3>
        {wishlistItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
            <p className="text-sm text-[var(--muted)]">
              {memberDisplayName(assignedMember)} hasn&apos;t added any wishlist
              items yet. You&apos;ll have to get creative!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
              >
                <p className="text-sm font-medium">{item.item_name}</p>
                {item.item_url && (
                  <a
                    href={item.item_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block truncate text-xs text-[var(--accent)] hover:underline"
                  >
                    {item.item_url}
                  </a>
                )}
                {item.notes && (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
