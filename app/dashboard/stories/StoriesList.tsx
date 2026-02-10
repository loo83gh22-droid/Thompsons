"use client";

import { useMemo, useState } from "react";
import { StoryCard } from "./StoryCard";

export type StoryForList = {
  id: string;
  title: string;
  content: string;
  cover_url: string | null;
  category: string;
  published: boolean;
  created_at: string;
  author_family_member_id: string | null;
  family_members: { name: string; nickname?: string | null; relationship?: string | null } | { name: string; nickname?: string | null; relationship?: string | null }[] | null;
};

const SORT_OPTIONS = [
  { value: "newest", label: "Most recent" },
  { value: "oldest", label: "Oldest first" },
  { value: "popular", label: "Most popular", disabled: true },
] as const;

export function StoriesList({ stories }: { stories: StoryForList[] }) {
  const [sort, setSort] = useState<"newest" | "oldest" | "popular">("newest");

  const sorted = useMemo(() => {
    const list = [...stories];
    if (sort === "oldest") list.sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
    else if (sort === "newest") list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    return list;
  }, [stories, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <span>Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "oldest" | "popular")}
            className="input-base min-h-0 w-auto py-1.5 text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} disabled={"disabled" in o && o.disabled}>
                {o.label}
                {"disabled" in o && o.disabled ? " (coming soon)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3">
        {sorted.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
      </div>
    </div>
  );
}
