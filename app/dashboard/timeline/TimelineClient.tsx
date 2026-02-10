"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { TimelineItem } from "./types";

const TYPE_LABELS: Record<TimelineItem["type"], string> = {
  journal: "Journal",
  voice_memo: "Voice memo",
  time_capsule: "Time capsule",
  photo: "Photo",
};

const TYPE_ICONS: Record<TimelineItem["type"], string> = {
  journal: "📔",
  voice_memo: "🎙️",
  time_capsule: "📮",
  photo: "🖼️",
};

type Member = { id: string; name: string };

export function TimelineClient({
  initialItems,
  members,
  thisDayItems,
  initialFilterMemberId,
}: {
  initialItems: TimelineItem[];
  members: Member[];
  thisDayItems: TimelineItem[];
  initialFilterMemberId?: string;
}) {
  const [sortOldestFirst, setSortOldestFirst] = useState(false);
  const [filterType, setFilterType] = useState<TimelineItem["type"] | "">("");
  const [filterMemberId, setFilterMemberId] = useState<string>(initialFilterMemberId ?? "");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");

  const filtered = useMemo(() => {
    let list = [...initialItems];
    if (filterType) list = list.filter((i) => i.type === filterType);
    if (filterMemberId) list = list.filter((i) => i.authorMemberId === filterMemberId);
    if (yearFilter) list = list.filter((i) => i.date.startsWith(yearFilter));
    if (monthFilter && yearFilter) list = list.filter((i) => i.date.startsWith(`${yearFilter}-${monthFilter}`));
    if (sortOldestFirst) list.reverse();
    return list;
  }, [initialItems, filterType, filterMemberId, yearFilter, monthFilter, sortOldestFirst, members]);

  const years = useMemo(() => {
    const set = new Set(initialItems.map((i) => i.date.slice(0, 4)).filter(Boolean));
    return Array.from(set).sort((a, b) => (b > a ? 1 : -1));
  }, [initialItems]);

  return (
    <div className="mt-8 space-y-8">
      {thisDayItems.length > 0 && (
        <section className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-6">
          <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
            This day in family history
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {thisDayItems.length} memory from past years on this date.
          </p>
          <ul className="mt-4 space-y-2">
            {thisDayItems.slice(0, 5).map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
                >
                  {item.thumbnailUrl && (
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
                      <Image src={item.thumbnailUrl} alt="" fill className="object-cover" sizes="48px" />
                    </div>
                  )}
                  {!item.thumbnailUrl && <span className="text-2xl">{TYPE_ICONS[item.type]}</span>}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-[var(--muted)]">{item.date}</span>
                    <p className="font-medium text-[var(--foreground)]">{item.title}</p>
                    {item.authorName && <p className="text-xs text-[var(--muted)]">{item.authorName}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span>Sort:</span>
            <button
              type="button"
              onClick={() => setSortOldestFirst(false)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${!sortOldestFirst ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "hover:bg-[var(--surface)]"}`}
            >
              Newest first
            </button>
            <button
              type="button"
              onClick={() => setSortOldestFirst(true)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${sortOldestFirst ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "hover:bg-[var(--surface)]"}`}
            >
              Oldest first
            </button>
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span>Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as TimelineItem["type"] | "")}
              className="input-base min-h-0 w-auto py-1.5 text-sm"
            >
              <option value="">All</option>
              {(Object.keys(TYPE_LABELS) as TimelineItem["type"][]).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span>Member:</span>
            <select
              value={filterMemberId}
              onChange={(e) => setFilterMemberId(e.target.value)}
              className="input-base min-h-0 w-auto py-1.5 text-sm"
            >
              <option value="">All</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span>Year:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="input-base min-h-0 w-auto py-1.5 text-sm"
            >
              <option value="">All</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          {yearFilter && (
            <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <span>Month:</span>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="input-base min-h-0 w-auto py-1.5 text-sm"
              >
                <option value="">All</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const m = String(i + 1).padStart(2, "0");
                  const name = new Date(2000, i, 1).toLocaleString("default", { month: "short" });
                  return <option key={m} value={m}>{name}</option>;
                })}
              </select>
            </label>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]/50 py-12 text-center">
            <p className="text-[var(--muted)]">
              {initialItems.length === 0
                ? "No timeline items yet. Add journal entries, photos, voice memos, or time capsules to see them here."
                : "No items match your filters. Try changing filters."}
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {filtered.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <Link
                  href={item.href}
                  className="flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-200 hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)] hover:shadow-md"
                >
                  {item.thumbnailUrl ? (
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image src={item.thumbnailUrl} alt="" fill className="object-cover" sizes="80px" />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--surface-hover)] text-3xl">
                      {TYPE_ICONS[item.type]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                      <span>{item.date}</span>
                      <span>·</span>
                      <span>{TYPE_LABELS[item.type]}</span>
                      {item.authorName && (
                        <>
                          <span>·</span>
                          <span>{item.authorName}</span>
                        </>
                      )}
                    </div>
                    <h3 className="mt-1 font-semibold text-[var(--foreground)]">{item.title}</h3>
                    {item.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-[var(--muted)]">{item.description}</p>
                    )}
                  </div>
                  <span className="text-[var(--muted)]">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
