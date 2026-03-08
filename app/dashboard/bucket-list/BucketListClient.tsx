"use client";

import { useState, useTransition } from "react";
import {
  toggleCheer,
  deleteBucketListItem,
  updateBucketListStatus,
} from "./actions";
import { AddItemSheet } from "./AddItemSheet";
import { CompleteItemSheet } from "./CompleteItemSheet";

// ── Types ─────────────────────────────────────────────────────────────────────

type Member = { id: string; name: string; nickname?: string | null; role: string };

type BucketItem = {
  id: string;
  title: string;
  description: string | null;
  scope: "family" | "personal";
  is_private: boolean;
  status: "dream" | "planned" | "in_progress" | "completed";
  category: string | null;
  target_date: string | null;
  completed_at: string | null;
  completed_note: string | null;
  sort_order: number;
  created_at: string;
  added_by: string | null;
  added_by_member: { id: string; name: string; nickname?: string | null } | null;
};

type Cheer = { item_id: string; member_id: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  travel: "✈️", adventure: "🏔️", learning: "📚", food: "🍽️",
  creative: "🎨", sports: "⚽", together: "👨‍👩‍👧‍👦", milestone: "🏆",
};

const STATUS_LABEL: Record<string, string> = {
  dream: "Dream", planned: "Planned", in_progress: "In Progress", completed: "Completed",
};

const STATUS_BORDER: Record<string, string> = {
  dream:       "border-l-purple-400",
  planned:     "border-l-blue-400",
  in_progress: "border-l-amber-400",
  completed:   "border-l-emerald-400",
};

const STATUS_BADGE: Record<string, string> = {
  dream:       "bg-purple-100 text-purple-700",
  planned:     "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed:   "bg-emerald-100 text-emerald-700",
};

function displayName(m: { name: string; nickname?: string | null } | null) {
  if (!m) return "Someone";
  return m.nickname?.trim() || m.name;
}

function initials(m: { name: string; nickname?: string | null }) {
  const n = m.nickname?.trim() || m.name;
  return n.charAt(0).toUpperCase();
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status] ?? "bg-gray-100 text-gray-600"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ── Item Card ─────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  cheers,
  currentMemberId,
  canEdit,
  onComplete,
}: {
  item: BucketItem;
  cheers: Cheer[];
  currentMemberId: string;
  canEdit: boolean;
  onComplete: (item: BucketItem) => void;
}) {
  const [pending, startTransition] = useTransition();
  const itemCheers = cheers.filter((c) => c.item_id === item.id);
  const iCheered = itemCheers.some((c) => c.member_id === currentMemberId);
  const isCompleted = item.status === "completed";
  const emoji = item.category ? (CATEGORY_EMOJI[item.category] ?? "🌟") : null;

  function handleCheer() {
    startTransition(async () => { await toggleCheer(item.id, currentMemberId, iCheered); });
  }
  function handleDelete() {
    if (!confirm(`Delete "${item.title}"?`)) return;
    startTransition(async () => { await deleteBucketListItem(item.id); });
  }
  function handleReopen() {
    startTransition(async () => { await updateBucketListStatus(item.id, "dream"); });
  }

  return (
    <div className={`group relative flex overflow-hidden rounded-xl border border-[var(--border)] border-l-4 bg-[var(--surface)] transition-all hover:shadow-sm ${
      isCompleted ? "opacity-75 " + STATUS_BORDER.completed : STATUS_BORDER[item.status] ?? ""
    }`}>
      {/* Emoji column */}
      {emoji && (
        <div className="flex w-12 shrink-0 items-start justify-center pt-4 text-xl leading-none">
          {emoji}
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 py-3 pr-4 ${emoji ? "" : "pl-4"}`}>
        {/* Title row */}
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
          <h3 className={`font-medium leading-snug text-[var(--foreground)] ${isCompleted ? "line-through opacity-50" : ""}`}>
            {item.title}
          </h3>
          <StatusBadge status={item.status} />
          {item.is_private && (
            <span className="text-xs text-[var(--muted)]">🔒</span>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">{item.description}</p>
        )}

        {/* Completion note */}
        {item.completed_note && (
          <p className="mt-1.5 text-sm italic text-emerald-600">✨ {item.completed_note}</p>
        )}

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
          {item.added_by_member && (
            <span>Added by {displayName(item.added_by_member)}</span>
          )}
          {item.target_date && !isCompleted && (
            <span>🎯 {new Date(item.target_date + "T12:00:00").toLocaleDateString("en-AU", { month: "short", year: "numeric" })}</span>
          )}
          {item.completed_at && (
            <span>✅ {new Date(item.completed_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-1">
          {!isCompleted && (
            <button
              type="button"
              onClick={handleCheer}
              disabled={pending}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                iCheered
                  ? "bg-amber-100 text-amber-700"
                  : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-amber-600"
              }`}
            >
              🙌{itemCheers.length > 0 && <span className="font-medium">{itemCheers.length}</span>}
            </button>
          )}

          {canEdit && !isCompleted && (
            <button
              type="button"
              onClick={() => onComplete(item)}
              className="rounded-lg px-2.5 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              ✓ Done
            </button>
          )}

          {canEdit && isCompleted && (
            <button
              type="button"
              onClick={handleReopen}
              disabled={pending}
              className="rounded-lg px-2.5 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Reopen
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="ml-auto rounded-lg px-2 py-1.5 text-xs text-[var(--muted)] opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Status section ────────────────────────────────────────────────────────────

function ItemSection({
  title,
  items,
  cheers,
  currentMemberId,
  currentMemberRole,
  onComplete,
  emptyText,
}: {
  title: string;
  items: BucketItem[];
  cheers: Cheer[];
  currentMemberId: string;
  currentMemberRole: string;
  onComplete: (item: BucketItem) => void;
  emptyText?: string;
}) {
  if (items.length === 0 && !emptyText) return null;
  const isAdultPlus = ["owner", "adult"].includes(currentMemberRole);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        {title} <span className="font-normal normal-case">({items.length})</span>
      </p>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-sm text-[var(--muted)]">
          {emptyText}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const canEdit = item.added_by === currentMemberId || (item.scope === "family" && isAdultPlus);
            return (
              <ItemCard
                key={item.id}
                item={item}
                cheers={cheers}
                currentMemberId={currentMemberId}
                canEdit={canEdit}
                onComplete={onComplete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Completed collapsible ─────────────────────────────────────────────────────

function CompletedSection({
  items, cheers, currentMemberId, currentMemberRole, onComplete,
}: {
  items: BucketItem[];
  cheers: Cheer[];
  currentMemberId: string;
  currentMemberRole: string;
  onComplete: (item: BucketItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const isAdultPlus = ["owner", "adult"].includes(currentMemberRole);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
          viewBox="0 0 12 12" fill="currentColor"
        >
          <path d="M4 2l5 4-5 4V2z" />
        </svg>
        Completed ({items.length})
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {items.map((item) => {
            const canEdit = item.added_by === currentMemberId || (item.scope === "family" && isAdultPlus);
            return (
              <ItemCard key={item.id} item={item} cheers={cheers} currentMemberId={currentMemberId} canEdit={canEdit} onComplete={onComplete} />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Personal member picker ────────────────────────────────────────────────────

function MemberPicker({
  members,
  selectedId,
  onSelect,
}: {
  members: Member[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {members.map((m) => {
        const selected = m.id === selectedId;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
              selected
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
            }`}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              selected ? "bg-white/20" : "bg-[var(--accent)]/15 text-[var(--accent)]"
            }`}>
              {initials(m)}
            </span>
            {displayName(m)}
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BucketListClient({
  currentMember,
  allMembers,
  items,
  cheers,
}: {
  currentMember: { id: string; name: string; role: string };
  allMembers: Member[];
  items: BucketItem[];
  cheers: Cheer[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [completeItem, setCompleteItem] = useState<BucketItem | null>(null);
  const [activeTab, setActiveTab] = useState<"family" | "personal">("family");
  const [selectedMemberId, setSelectedMemberId] = useState(currentMember.id);

  const familyItems = items.filter((i) => i.scope === "family");
  const personalItems = items.filter((i) => i.scope === "personal");

  const totalActive = familyItems.filter((i) => i.status !== "completed").length;
  const totalDone = familyItems.filter((i) => i.status === "completed").length;
  const totalFamily = familyItems.length;
  const progress = totalFamily > 0 ? Math.round((totalDone / totalFamily) * 100) : 0;

  // Group family items by status
  const activeGroups = (["in_progress", "planned", "dream"] as const).map((s) => ({
    status: s,
    label: STATUS_LABEL[s],
    items: familyItems.filter((i) => i.status === s).sort((a, b) => a.sort_order - b.sort_order),
  }));
  const completedFamilyItems = familyItems.filter((i) => i.status === "completed");

  // Personal: show selected member only
  const selectedMember = allMembers.find((m) => m.id === selectedMemberId) ?? allMembers[0];
  const isViewingOwnList = selectedMemberId === currentMember.id;
  const viewedPersonalItems = personalItems.filter((i) => i.added_by === selectedMemberId);
  const viewedActive = viewedPersonalItems.filter((i) => i.status !== "completed");
  const viewedDone = viewedPersonalItems.filter((i) => i.status === "completed");

  return (
    <>
      {/* ── Page header ── */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
              Family Bucket List
            </h1>
            <p className="mt-1.5 text-[var(--muted)]">
              Dreams for the family and for yourself — big and small.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="min-h-[44px] rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-sm transition-opacity hover:opacity-90"
          >
            + Add dream
          </button>
        </div>

        {/* Stats */}
        {totalFamily > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--foreground)]">{totalActive}</p>
                <p className="text-xs text-[var(--muted)]">active</p>
              </div>
              <div className="h-8 w-px bg-[var(--border)]" />
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{totalDone}</p>
                <p className="text-xs text-[var(--muted)]">completed</p>
              </div>
            </div>
            {totalFamily > 1 && (
              <div className="flex flex-1 min-w-[120px] items-center gap-2">
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-hover)]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-[var(--muted)] tabular-nums">{progress}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile tab switcher ── */}
      <div className="mb-6 flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 sm:hidden">
        {(["family", "personal"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab === "family" ? "👨‍👩‍👧 Family" : "👤 Personal"}
          </button>
        ))}
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1fr_360px]">

        {/* Family list */}
        <div className={activeTab === "personal" ? "hidden sm:block" : ""}>
          <div className="mb-5 flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">Our Family List</h2>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--muted)]">
              shared
            </span>
          </div>

          {familyItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-12 text-center">
              <p className="text-5xl">🌟</p>
              <p className="mt-4 text-lg font-semibold text-[var(--foreground)]">Start dreaming together</p>
              <p className="mt-1.5 text-sm text-[var(--muted)]">Add your first family bucket list item — it could be a weekend adventure or a trip of a lifetime.</p>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="mt-5 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-foreground)] hover:opacity-90"
              >
                + Add a family dream
              </button>
            </div>
          ) : (
            <div className="space-y-7">
              {activeGroups.map((group) => (
                <ItemSection
                  key={group.status}
                  title={group.label}
                  items={group.items}
                  cheers={cheers}
                  currentMemberId={currentMember.id}
                  currentMemberRole={currentMember.role}
                  onComplete={setCompleteItem}
                />
              ))}

              {completedFamilyItems.length > 0 && (
                <CompletedSection
                  items={completedFamilyItems}
                  cheers={cheers}
                  currentMemberId={currentMember.id}
                  currentMemberRole={currentMember.role}
                  onComplete={setCompleteItem}
                />
              )}
            </div>
          )}
        </div>

        {/* Personal lists */}
        <div className={activeTab === "family" ? "hidden sm:block" : ""}>
          <div className="mb-5">
            <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">Personal Dreams</h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Each person&apos;s own list — some may be private</p>
          </div>

          {/* Member picker */}
          <div className="mb-5">
            <MemberPicker
              members={allMembers}
              selectedId={selectedMemberId}
              onSelect={setSelectedMemberId}
            />
          </div>

          {/* Selected member's list */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/15 text-sm font-bold text-[var(--accent)]">
                  {selectedMember ? initials(selectedMember) : "?"}
                </span>
                <div>
                  <p className="font-medium text-[var(--foreground)]">
                    {selectedMember ? displayName(selectedMember) : ""}
                    {isViewingOwnList && <span className="ml-1 text-xs font-normal text-[var(--muted)]">(you)</span>}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {viewedActive.length} active · {viewedDone.length} done
                  </p>
                </div>
              </div>
              {isViewingOwnList && (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  + Add
                </button>
              )}
            </div>

            {viewedPersonalItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center">
                <p className="text-2xl">✨</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {isViewingOwnList
                    ? "Add your personal dreams here — they can be private to just you."
                    : `${selectedMember ? displayName(selectedMember) : "They"} hasn't shared any dreams yet.`}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {viewedActive.length > 0 && (
                  <div className="space-y-2">
                    {viewedActive.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        cheers={cheers}
                        currentMemberId={currentMember.id}
                        canEdit={item.added_by === currentMember.id}
                        onComplete={setCompleteItem}
                      />
                    ))}
                  </div>
                )}

                {viewedDone.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                      Completed ({viewedDone.length})
                    </p>
                    {viewedDone.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        cheers={cheers}
                        currentMemberId={currentMember.id}
                        canEdit={item.added_by === currentMember.id}
                        onComplete={setCompleteItem}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sheets */}
      {addOpen && (
        <AddItemSheet
          currentMember={currentMember}
          allMembers={allMembers}
          onClose={() => setAddOpen(false)}
        />
      )}
      {completeItem && (
        <CompleteItemSheet
          item={completeItem}
          onClose={() => setCompleteItem(null)}
        />
      )}
    </>
  );
}
