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

const STATUS_ORDER: Record<string, number> = {
  in_progress: 0, planned: 1, dream: 2, completed: 3,
};

function displayName(m: { name: string; nickname?: string | null } | null) {
  if (!m) return "Someone";
  return m.nickname?.trim() || m.name;
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    dream:       "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    planned:     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    completed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colours[status] ?? ""}`}>
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

  function handleCheer() {
    startTransition(async () => {
      await toggleCheer(item.id, currentMemberId, iCheered);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${item.title}"?`)) return;
    startTransition(async () => {
      await deleteBucketListItem(item.id);
    });
  }

  function handleReopenDream() {
    startTransition(async () => {
      await updateBucketListStatus(item.id, "dream");
    });
  }

  return (
    <div className={`group relative rounded-xl border transition-all ${
      isCompleted
        ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-900/10"
        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/40"
    }`}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {item.category && (
            <span className="mt-0.5 shrink-0 text-xl leading-none" aria-hidden>
              {CATEGORY_EMOJI[item.category] ?? "🌟"}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`font-medium text-[var(--foreground)] ${isCompleted ? "line-through opacity-60" : ""}`}>
                {item.title}
              </h3>
              <StatusBadge status={item.status} />
              {item.is_private && (
                <span className="rounded-full bg-[var(--surface-hover)] px-2 py-0.5 text-xs text-[var(--muted)]">
                  🔒 Private
                </span>
              )}
            </div>
            {item.description && (
              <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">{item.description}</p>
            )}
            {item.completed_note && (
              <p className="mt-1.5 text-sm italic text-emerald-700 dark:text-emerald-400">
                ✨ {item.completed_note}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
              {item.added_by_member && (
                <span>Added by {displayName(item.added_by_member)}</span>
              )}
              {item.target_date && !isCompleted && (
                <span>🎯 By {new Date(item.target_date + "T12:00:00").toLocaleDateString("en-AU", { month: "short", year: "numeric" })}</span>
              )}
              {item.completed_at && (
                <span>✅ {new Date(item.completed_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="mt-3 flex items-center gap-2">
          {/* Cheer button */}
          {!isCompleted && (
            <button
              type="button"
              onClick={handleCheer}
              disabled={pending}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                iCheered
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-[var(--surface-hover)] text-[var(--muted)] hover:bg-amber-50 hover:text-amber-600"
              }`}
              aria-label={iCheered ? "Remove cheer" : "Cheer this on"}
            >
              <span aria-hidden>🙌</span>
              <span>{itemCheers.length > 0 ? itemCheers.length : ""}</span>
            </button>
          )}

          {/* Complete button */}
          {canEdit && !isCompleted && (
            <button
              type="button"
              onClick={() => onComplete(item)}
              className="rounded-lg px-2.5 py-1.5 text-sm text-emerald-600 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              ✓ Mark complete
            </button>
          )}

          {/* Reopen as dream */}
          {canEdit && isCompleted && (
            <button
              type="button"
              onClick={handleReopenDream}
              disabled={pending}
              className="rounded-lg px-2.5 py-1.5 text-xs text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)]"
            >
              Reopen
            </button>
          )}

          {/* Delete */}
          {canEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="ml-auto rounded-lg px-2 py-1.5 text-xs text-[var(--muted)] opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              aria-label="Delete item"
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
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">{title}</h3>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] p-4 text-center text-sm text-[var(--muted)]">
          {emptyText}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const canEdit =
              item.added_by === currentMemberId ||
              (item.scope === "family" && isAdultPlus);
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

  const familyItems = items.filter((i) => i.scope === "family");
  const personalItems = items.filter((i) => i.scope === "personal");

  // Group family items by status
  const grouped = (["in_progress", "planned", "dream", "completed"] as const).map((s) => ({
    status: s,
    label: STATUS_LABEL[s],
    items: familyItems
      .filter((i) => i.status === s)
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.sort_order - b.sort_order),
  }));

  const activeFamily = grouped.filter((g) => g.status !== "completed");
  const completedFamily = grouped.find((g) => g.status === "completed")!;

  // Group personal items by member
  const memberPersonalItems = allMembers.map((m) => ({
    member: m,
    items: personalItems.filter((i) => i.added_by === m.id),
  }));

  const totalFamilyActive = familyItems.filter((i) => i.status !== "completed").length;
  const totalFamilyDone = familyItems.filter((i) => i.status === "completed").length;

  return (
    <>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
              Family Bucket List
            </h1>
            <p className="mt-2 text-[var(--muted)]">
              Dreams for the family and for yourself — big and small.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="min-h-[44px] rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
          >
            + Add item
          </button>
        </div>

        {/* Summary strip */}
        {(totalFamilyActive > 0 || totalFamilyDone > 0) && (
          <div className="mt-5 flex flex-wrap gap-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center">
              <p className="text-2xl font-bold text-[var(--foreground)]">{totalFamilyActive}</p>
              <p className="text-xs text-[var(--muted)]">active</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-center dark:border-emerald-800/40 dark:bg-emerald-900/10">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{totalFamilyDone}</p>
              <p className="text-xs text-[var(--muted)]">completed</p>
            </div>
          </div>
        )}
      </div>

      {/* Tab switcher (mobile) */}
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
            {tab === "family" ? "Family" : "Personal"}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-[1fr_320px]">

        {/* ── Family list ── */}
        <div className={activeTab === "personal" ? "hidden sm:block" : ""}>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
              Our Family List
            </h2>
            <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--muted)] border border-[var(--border)]">
              shared
            </span>
          </div>

          {familyItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center">
              <p className="text-4xl">🌟</p>
              <p className="mt-3 font-medium text-[var(--foreground)]">Your family&apos;s dreams start here</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Add your first family bucket list item — big or small.</p>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90"
              >
                + Add family item
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {activeFamily.map((group) => (
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

              {/* Completed — collapsible */}
              {completedFamily.items.length > 0 && (
                <CompletedSection
                  items={completedFamily.items}
                  cheers={cheers}
                  currentMemberId={currentMember.id}
                  currentMemberRole={currentMember.role}
                  onComplete={setCompleteItem}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Personal lists ── */}
        <div className={activeTab === "family" ? "hidden sm:block" : ""}>
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">Personal Lists</h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Each person&apos;s own dreams</p>
          </div>

          <div className="space-y-6">
            {memberPersonalItems.map(({ member, items: mItems }) => {
              const isMe = member.id === currentMember.id;
              const mActive = mItems.filter((i) => i.status !== "completed");
              const mDone = mItems.filter((i) => i.status === "completed");

              return (
                <div key={member.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/15 text-sm font-bold text-[var(--accent)]">
                        {(member.nickname || member.name).charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium text-[var(--foreground)]">
                        {displayName(member)}{isMe ? " (you)" : ""}
                      </span>
                    </div>
                    {isMe && (
                      <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="rounded-lg px-2 py-1 text-xs text-[var(--accent)] hover:bg-[var(--surface-hover)]"
                      >
                        + Add
                      </button>
                    )}
                  </div>

                  {mItems.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">
                      {isMe ? "Add your personal dreams — they can be private." : "Nothing shared yet."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {mActive.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          cheers={cheers}
                          currentMemberId={currentMember.id}
                          canEdit={item.added_by === currentMember.id}
                          onComplete={setCompleteItem}
                        />
                      ))}
                      {mDone.map((item) => (
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
              );
            })}
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
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        Completed ({items.length})
      </button>
      {open && (
        <div className="mt-3 space-y-2">
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
