"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { thumbUrl } from "@/src/lib/imageUrl";
import { UI_DISPLAY } from "@/src/lib/constants";
import { CalendarDrillDown } from "@/app/components/CalendarDrillDown";
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

const CATEGORY_LABELS: Record<string, string> = {
  family_history: "Family History",
  advice_wisdom: "Advice & Wisdom",
  memorable_moments: "Memorable Moments",
  traditions: "Traditions",
  recipes_food: "Recipes & Food",
  other: "Other",
};

function storyAuthorDisplay(fm: StoryForList["family_members"]): string {
  if (!fm) return "";
  const one = Array.isArray(fm) ? fm[0] : fm;
  if (!one) return "";
  const name = one.nickname?.trim() || one.name || "";
  return one.relationship?.trim() ? `${name} (${one.relationship})` : name;
}

function StoryCompactRow({ story }: { story: StoryForList }) {
  return (
    <Link
      href={`/dashboard/stories/${story.id}`}
      className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--surface-hover)]"
    >
      {story.cover_url ? (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--surface)]">
          <Image src={thumbUrl(story.cover_url, 80)} alt="" fill unoptimized className="object-cover" sizes="40px" />
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--surface)] text-lg">
          📖
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)]">
          {story.title}
        </p>
        <p className="truncate text-xs text-[var(--muted)]">
          {CATEGORY_LABELS[story.category] ?? story.category}
          {storyAuthorDisplay(story.family_members) ? ` · ${storyAuthorDisplay(story.family_members)}` : ""}
        </p>
      </div>
    </Link>
  );
}

export function StoriesList({ stories }: { stories: StoryForList[] }) {
  const [sort, setSort] = useState<"newest" | "oldest" | "popular">("newest");

  const sorted = useMemo(() => {
    const list = [...stories];
    if (sort === "oldest") list.sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
    else if (sort === "newest") list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    return list;
  }, [stories, sort]);

  const recentStories = sorted.slice(0, UI_DISPLAY.recentFullCardCount);
  const olderStories = sorted.slice(UI_DISPLAY.recentFullCardCount);

  const getStoryDate = useCallback(
    (s: StoryForList) => new Date(s.created_at),
    []
  );

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
      {recentStories.length > 0 && (
        <div className="grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3">
          {recentStories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      )}
      <CalendarDrillDown
        items={olderStories}
        getDate={getStoryDate}
        renderCompactRow={(story) => <StoryCompactRow story={story} />}
        sectionLabel="Earlier stories"
        countLabel={(n) => `${n} ${n === 1 ? "story" : "stories"}`}
      />
    </div>
  );
}
