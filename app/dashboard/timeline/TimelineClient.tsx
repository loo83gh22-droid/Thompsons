"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { UI_DISPLAY } from "@/src/lib/constants";
import type { TimelineItem } from "./types";

const TYPE_LABELS: Record<TimelineItem["type"], string> = {
  journal: "Journal",
  voice_memo: "Voice memo",
  time_capsule: "Time capsule",
  photo: "Photo",
  message: "Message",
};

const TYPE_ICONS: Record<TimelineItem["type"], string> = {
  journal: "📔",
  voice_memo: "🎙️",
  time_capsule: "📮",
  photo: "🖼️",
  message: "💬",
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function groupByMonthYear(items: TimelineItem[], oldestFirst: boolean): { key: string; label: string; items: TimelineItem[] }[] {
  const map = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const key = item.date.slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  const keys = Array.from(map.keys()).sort((a, b) => (oldestFirst ? (a > b ? 1 : -1) : (b > a ? 1 : -1)));
  return keys.map((key) => {
    const [y, m] = key.split("-");
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    const label = date.toLocaleString("default", { month: "long", year: "numeric" });
    return { key, label, items: map.get(key)! };
  });
}

type Member = { id: string; name: string };

function authorDisplay(item: TimelineItem): string {
  if (!item.authorName) return "";
  return item.authorRelationship ? `${item.authorName} (${item.authorRelationship})` : item.authorName;
}

function TimelineItemRow({
  item,
  typeLabels,
  typeIcons,
  audioRefs,
  formatDuration,
}: {
  item: TimelineItem;
  typeLabels: Record<TimelineItem["type"], string>;
  typeIcons: Record<TimelineItem["type"], string>;
  audioRefs: React.MutableRefObject<Record<string, HTMLAudioElement | null>>;
  formatDuration: (s: number) => string;
}) {
  const audioId = `audio-${item.type}-${item.id}`;

  const handlePlay = (e: React.MouseEvent) => {
    if (item.type !== "voice_memo") return;
    e.preventDefault();
    e.stopPropagation();
    const el = audioRefs.current[audioId];
    if (el) {
      if (el.paused) el.play();
      else el.pause();
    }
  };

  return (
    <li>
      <Link
        href={item.href}
        className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-200 hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)] hover:shadow-md sm:flex-row sm:items-start sm:gap-4"
      >
        {item.thumbnailUrl ? (
          <div className="relative h-32 w-full flex-shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-20">
            <Image src={item.thumbnailUrl} alt={item.title || `${TYPE_LABELS[item.type]} thumbnail`} fill unoptimized className="object-cover" sizes="(max-width: 640px) 100vw, 80px" />
          </div>
        ) : (
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--surface-hover)] text-3xl">
            {typeIcons[item.type]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span>{item.date}</span>
            <span>·</span>
            <span>{typeLabels[item.type]}</span>
            {authorDisplay(item) && (
              <>
                <span>·</span>
                <span>{authorDisplay(item)}</span>
              </>
            )}
          </div>
          <h3 className="mt-1 font-semibold text-[var(--foreground)]">{item.title}</h3>
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-[var(--muted)]">{item.description}</p>
          )}
          {item.type === "voice_memo" && (item.durationSeconds != null || item.audioUrl) && (
            <div className="mt-2 flex items-center gap-2">
              {item.audioUrl && (
                <>
                  <audio ref={(el) => { audioRefs.current[audioId] = el; }} src={item.audioUrl} preload="metadata" className="hidden" />
                  <button
                    type="button"
                    onClick={handlePlay}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/30"
                    aria-label="Play voice memo"
                  >
                    ▶
                  </button>
                </>
              )}
              {item.durationSeconds != null && (
                <span className="text-xs text-[var(--muted)]">{formatDuration(item.durationSeconds)}</span>
              )}
            </div>
          )}
        </div>
        <span className="self-center text-[var(--muted)] sm:self-auto">→</span>
      </Link>
    </li>
  );
}

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
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [displayCount, setDisplayCount] = useState<number>(UI_DISPLAY.timelinePageSize);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const filtered = useMemo(() => {
    let list = [...initialItems];
    if (filterType) list = list.filter((i) => i.type === filterType);
    if (filterMemberId) list = list.filter((i) => i.authorMemberId === filterMemberId);
    if (dateFrom) list = list.filter((i) => i.date >= dateFrom);
    if (dateTo) list = list.filter((i) => i.date <= dateTo);
    if (sortOldestFirst) list.reverse();
    return list;
  }, [initialItems, filterType, filterMemberId, dateFrom, dateTo, sortOldestFirst]);

  const visibleItems = useMemo(() => filtered.slice(0, displayCount), [filtered, displayCount]);
  const grouped = useMemo(() => groupByMonthYear(visibleItems, sortOldestFirst), [visibleItems, sortOldestFirst]);
  const hasMore = displayCount < filtered.length;

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
                      <Image src={item.thumbnailUrl} alt={item.title || `${TYPE_ICONS[item.type]} thumbnail`} fill unoptimized className="object-cover" sizes="48px" />
                    </div>
                  )}
                  {!item.thumbnailUrl && <span className="text-2xl">{TYPE_ICONS[item.type]}</span>}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-[var(--muted)]">{item.date}</span>
                    <p className="font-medium text-[var(--foreground)]">{item.title}</p>
                    {authorDisplay(item) && <p className="text-xs text-[var(--muted)]">{authorDisplay(item)}</p>}
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
            <span>From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-base min-h-0 w-auto py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span>To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-base min-h-0 w-auto py-1.5 text-sm"
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          initialItems.length === 0 ? (
            <div className="mt-8 flex items-center justify-center py-8">
              <div className="w-full max-w-lg rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-5 py-10 text-center sm:px-8 sm:py-12">
                <span className="text-5xl" role="img" aria-hidden="true">&#x1F4C5;</span>
                <h2 className="mt-4 font-display text-xl font-semibold text-[var(--accent)]">
                  Your family story starts today
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  Every photo, journal entry, and voice memo you create will appear here as a beautiful timeline of your family&apos;s life.
                </p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/journal/new"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--background)] transition-colors hover:bg-[var(--accent)]/90"
                  >
                    Create Your First Memory
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]/50 py-12 text-center">
              <p className="font-medium text-[var(--foreground)]">
                No items match your filters. Try changing filters.
              </p>
            </div>
          )
        ) : (
          <div className="mt-6 flex flex-col gap-8">
            {grouped.map(({ key, label, items: groupItems }) => (
              <section key={key}>
                <h2 className="sticky top-0 z-10 mb-3 bg-[var(--background)]/95 py-1 font-display text-lg font-semibold text-[var(--foreground)] backdrop-blur sm:bg-transparent sm:backdrop-blur-none">
                  {label}
                </h2>
                <ul className="flex flex-col gap-3">
                  {groupItems.map((item) => (
                    <TimelineItemRow
                      key={`${item.type}-${item.id}`}
                      item={item}
                      typeLabels={TYPE_LABELS}
                      typeIcons={TYPE_ICONS}
                      audioRefs={audioRefs}
                      formatDuration={formatDuration}
                    />
                  ))}
                </ul>
              </section>
            ))}
            {hasMore && (
              <div className="flex justify-center py-4">
                <button
                  type="button"
                  onClick={() => setDisplayCount((c) => c + UI_DISPLAY.timelinePageSize)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
