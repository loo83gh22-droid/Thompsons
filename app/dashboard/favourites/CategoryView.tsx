"use client";

import { useState, useMemo } from "react";
import { CurrentFavourites } from "./CurrentFavourites";
import { AddFavouriteForm } from "./AddFavouriteForm";
import { FavouritesHistory } from "./FavouritesHistory";
import type { FavouriteCategory } from "./actions";

export type Member = { id: string; name: string };

type RawItem = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  age: number | null;
  photo_url: string | null;
  created_at: string;
  member_id: string;
};

type RawHistoryItem = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  removed_at: string;
  member_id: string;
};

export function CategoryView({
  members,
  items,
  historyItems,
  category,
  categoryLabel,
}: {
  members: Member[];
  items: RawItem[];
  historyItems: RawHistoryItem[];
  category: string;
  categoryLabel: string;
}) {
  const [filterMemberId, setFilterMemberId] = useState<string | null>(null);

  // member id → name lookup
  const memberMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const mem of members) m.set(mem.id, mem.name);
    return m;
  }, [members]);

  // Detect titles shared by 2+ distinct members (family favourites)
  const sharedTitles = useMemo(() => {
    const titleToMembers = new Map<string, Set<string>>();
    for (const item of items) {
      const key = item.title.trim().toLowerCase();
      if (!titleToMembers.has(key)) titleToMembers.set(key, new Set());
      titleToMembers.get(key)!.add(item.member_id);
    }
    const shared = new Set<string>();
    for (const [title, mems] of titleToMembers) {
      if (mems.size > 1) shared.add(title);
    }
    return shared;
  }, [items]);

  // Enrich items with memberName + isShared
  const enrichedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        memberName: memberMap.get(item.member_id) ?? "Unknown",
        isShared: sharedTitles.has(item.title.trim().toLowerCase()),
      })),
    [items, memberMap, sharedTitles]
  );

  // Enrich history with memberName
  const enrichedHistory = useMemo(
    () =>
      historyItems.map((item) => ({
        ...item,
        memberName: memberMap.get(item.member_id) ?? "Unknown",
      })),
    [historyItems, memberMap]
  );

  const filteredItems = useMemo(
    () =>
      filterMemberId
        ? enrichedItems.filter((i) => i.member_id === filterMemberId)
        : enrichedItems,
    [enrichedItems, filterMemberId]
  );

  const filteredHistory = useMemo(
    () =>
      filterMemberId
        ? enrichedHistory.filter((i) => i.member_id === filterMemberId)
        : enrichedHistory,
    [enrichedHistory, filterMemberId]
  );

  const isAllView = filterMemberId === null;
  const sharedCount = enrichedItems.filter((i) => i.isShared).length;

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* All pill */}
        <button
          type="button"
          onClick={() => setFilterMemberId(null)}
          className={`min-h-[36px] rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            isAllView
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
              : "border border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]"
          }`}
        >
          All
        </button>

        {/* Per-member pills */}
        {members.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() =>
              setFilterMemberId(
                member.id === filterMemberId ? null : member.id
              )
            }
            className={`min-h-[36px] rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              filterMemberId === member.id
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "border border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]"
            }`}
          >
            {member.name}
          </button>
        ))}

        {/* Family favourites pill — only show when there are shared items */}
        {sharedCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterMemberId("__shared__")}
            className={`min-h-[36px] rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              filterMemberId === "__shared__"
                ? "bg-amber-500 text-white shadow-sm"
                : "border border-amber-400/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            }`}
          >
            ⭐ Family favourites ({sharedCount})
          </button>
        )}

        {/* Spacer + Add button */}
        <div className="flex-1" />
        <AddFavouriteForm
          category={category as FavouriteCategory}
          categoryLabel={categoryLabel}
          members={members}
          defaultMemberId={filterMemberId === "__shared__" ? null : filterMemberId}
        />
      </div>

      {/* Items grid */}
      <div className="mt-6">
        <CurrentFavourites
          items={
            filterMemberId === "__shared__"
              ? enrichedItems.filter((i) => i.isShared)
              : filteredItems
          }
          categoryLabel={categoryLabel}
          showMemberBadge={isAllView || filterMemberId === "__shared__"}
        />
      </div>

      {/* History */}
      <FavouritesHistory
        items={
          filterMemberId === "__shared__"
            ? enrichedHistory.filter((i) =>
                sharedTitles.has(i.title.trim().toLowerCase())
              )
            : filteredHistory
        }
        showMemberName={isAllView || filterMemberId === "__shared__"}
      />
    </div>
  );
}
