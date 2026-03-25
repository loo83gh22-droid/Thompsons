"use client";

import { useState, useMemo } from "react";
import { CurrentFavourites } from "./CurrentFavourites";
import { AddFavouriteForm } from "./AddFavouriteForm";
import { FavouritesHistory } from "./FavouritesHistory";
import type { FavouriteCategory } from "./actions";

export type Member = { id: string; name: string };

// Consistent per-member accent colours (hex, used inline to avoid Tailwind purge)
const MEMBER_COLORS = [
  "#e85d8a", // rose
  "#4299e1", // blue
  "#48bb78", // green
  "#9f7aea", // purple
  "#ed8936", // orange
  "#38b2ac", // teal
  "#f687b3", // pink
  "#76e4f7", // cyan
];

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
  const [sortBy, setSortBy] = useState<"recent" | "alpha" | "member">("recent");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // member id -> name lookup
  const memberMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const mem of members) m.set(mem.id, mem.name);
    return m;
  }, [members]);

  // member id -> hex color (stable per member index)
  const memberColorMap = useMemo(() => {
    const m = new Map<string, string>();
    members.forEach((mem, idx) => {
      m.set(mem.id, MEMBER_COLORS[idx % MEMBER_COLORS.length]);
    });
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

  // Enrich items with memberName + memberColor + isShared
  const enrichedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        memberName: memberMap.get(item.member_id) ?? "Unknown",
        memberColor: memberColorMap.get(item.member_id) ?? "#94a3b8",
        isShared: sharedTitles.has(item.title.trim().toLowerCase()),
      })),
    [items, memberMap, memberColorMap, sharedTitles]
  );

  // Enrich history with memberName + memberColor
  const enrichedHistory = useMemo(
    () =>
      historyItems.map((item) => ({
        ...item,
        memberName: memberMap.get(item.member_id) ?? "Unknown",
        memberColor: memberColorMap.get(item.member_id) ?? "#94a3b8",
      })),
    [historyItems, memberMap, memberColorMap]
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
  const isSharedView = filterMemberId === "__shared__";
  const sharedCount = enrichedItems.filter((i) => i.isShared).length;

  const displayedItems = useMemo(() => {
    const base = isSharedView
      ? enrichedItems.filter((i) => i.isShared)
      : filteredItems;

    if (sortBy === "alpha") {
      return [...base].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === "member") {
      return [...base].sort(
        (a, b) =>
          a.memberName.localeCompare(b.memberName) ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    // "recent" - default server order (created_at desc)
    return base;
  }, [isSharedView, enrichedItems, filteredItems, sortBy]);

  // Stats
  const uniqueMembersInView = new Set(displayedItems.map((i) => i.member_id)).size;

  return (
    <div>
      {/* Filter row: member dropdown + sort + add button */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Member filter dropdown */}
        {members.length > 0 && (
          <select
            value={filterMemberId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setFilterMemberId(v === "" ? null : v);
            }}
            className="input-base h-9 rounded-full px-3 py-0 text-sm"
          >
            <option value="">Everyone</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
            {sharedCount > 0 && (
              <option value="__shared__">Family Favourites</option>
            )}
          </select>
        )}

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "recent" | "alpha" | "member")}
          className="input-base h-9 rounded-full px-3 py-0 text-sm"
        >
          <option value="recent">Recent</option>
          <option value="alpha">A-Z</option>
          <option value="member">By member</option>
        </select>

        {/* Add button */}
        <AddFavouriteForm
          category={category as FavouriteCategory}
          categoryLabel={categoryLabel}
          members={members}
          defaultMemberId={isSharedView ? null : filterMemberId}
          externalOpen={isAddFormOpen}
          onExternalClose={() => setIsAddFormOpen(false)}
        />
      </div>

      {/* Stats line */}
      {displayedItems.length > 0 && (
        <p className="mt-2 text-xs text-[var(--muted)]">
          {displayedItems.length} {displayedItems.length === 1 ? "item" : "items"}
          {(isAllView || isSharedView) && uniqueMembersInView > 1 && (
            <> &middot; {uniqueMembersInView} members</>
          )}
        </p>
      )}

      {/* Items grid */}
      <div className="mt-5">
        <CurrentFavourites
          items={displayedItems}
          categoryLabel={categoryLabel}
          showMemberBadge={isAllView || isSharedView}
          category={category}
          onAddClick={() => setIsAddFormOpen(true)}
        />
      </div>

      {/* History */}
      <FavouritesHistory
        items={
          isSharedView
            ? enrichedHistory.filter((i) =>
                sharedTitles.has(i.title.trim().toLowerCase())
              )
            : filteredHistory
        }
        showMemberName={isAllView || isSharedView}
      />
    </div>
  );
}
