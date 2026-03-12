"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { thumbUrl } from "@/src/lib/imageUrl";
import { JournalPhotoGallery } from "./JournalPhotoGallery";
import { DeleteJournalEntryButton } from "./DeleteJournalEntryButton";

/* ── Types ─────────────────────────────────────────────────── */

export type JournalEntryData = {
  id: string;
  title: string | null;
  content: string | null;
  location: string | null;
  trip_date: string | null;
  created_at: string;
  author_id: string | null;
  created_by: string | null;
  cover_photo_id: string | null;
  authorLabel: string | null;
  authorMemberId: string | null;
  dateFormatted: string;
  photos: { id: string; url: string; caption: string | null }[];
  videos: { id: string; url: string; duration_seconds: number | null }[];
  perspectiveCount: number;
  memberIds: string[];
};

export type FamilyMemberInfo = {
  id: string;
  name: string;
  nickname: string | null;
};

interface JournalListClientProps {
  entries: JournalEntryData[];
  members: FamilyMemberInfo[];
  myMemberId: string | null;
  myRole: string | null;
}

/* ── Helpers ───────────────────────────────────────────────── */

function entryDate(entry: JournalEntryData): Date {
  return new Date(entry.trip_date || entry.created_at);
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ── Calendar structure ───────────────────────────────────── */

type CalendarYear = {
  year: number;
  months: CalendarMonth[];
  entryCount: number;
};

type CalendarMonth = {
  month: number;
  label: string;
  entries: JournalEntryData[];
};

function buildCalendar(entries: JournalEntryData[]): CalendarYear[] {
  const yearMap = new Map<number, Map<number, JournalEntryData[]>>();

  for (const entry of entries) {
    const d = entryDate(entry);
    const y = d.getFullYear();
    const m = d.getMonth();
    if (!yearMap.has(y)) yearMap.set(y, new Map());
    const monthMap = yearMap.get(y)!;
    if (!monthMap.has(m)) monthMap.set(m, []);
    monthMap.get(m)!.push(entry);
  }

  const years: CalendarYear[] = [];
  for (const [year, monthMap] of yearMap) {
    const months: CalendarMonth[] = [];
    let entryCount = 0;
    for (const [month, monthEntries] of monthMap) {
      months.push({ month, label: MONTH_NAMES[month], entries: monthEntries });
      entryCount += monthEntries.length;
    }
    months.sort((a, b) => b.month - a.month);
    years.push({ year, months, entryCount });
  }
  years.sort((a, b) => b.year - a.year);
  return years;
}

/* ── Chevron icon ─────────────────────────────────────────── */

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

/* ── Component ─────────────────────────────────────────────── */

export function JournalListClient({
  entries,
  members,
  myMemberId,
  myRole,
}: JournalListClientProps) {
  const [filterMemberId, setFilterMemberId] = useState<string>("all");
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // Filter entries by selected member
  const filteredEntries = useMemo(() => {
    if (filterMemberId === "all") return entries;
    return entries.filter(
      (e) =>
        e.authorMemberId === filterMemberId ||
        e.memberIds.includes(filterMemberId)
    );
  }, [entries, filterMemberId]);

  // Split into recent (full view) and older (calendar)
  const recentEntries = filteredEntries.slice(0, 10);
  const olderEntries = filteredEntries.slice(10);

  // Build calendar structure for older entries
  const calendar = useMemo(() => buildCalendar(olderEntries), [olderEntries]);

  function getCoverUrl(entry: JournalEntryData): string | null {
    if (entry.cover_photo_id) {
      const coverPhoto = entry.photos.find((p) => p.id === entry.cover_photo_id);
      if (coverPhoto) return coverPhoto.url;
    }
    if (entry.photos.length > 0) return entry.photos[0].url;
    return null;
  }

  function canEdit(entry: JournalEntryData): boolean {
    const isOwner = myRole === "owner";
    const isCreator = entry.created_by
      ? entry.created_by === myMemberId
      : entry.author_id === myMemberId;
    return isOwner || isCreator;
  }

  function toggleYear(year: number) {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  function toggleMonth(key: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div>
      {/* Toolbar: filter */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="member-filter" className="text-sm text-[var(--muted)]">
            Filter by:
          </label>
          <select
            id="member-filter"
            value={filterMemberId}
            onChange={(e) => setFilterMemberId(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="all">Everyone</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nickname || m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredEntries.length === 0 && filterMemberId !== "all" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-[var(--muted)]">
            No journal entries found for this person.
          </p>
          <button
            type="button"
            onClick={() => setFilterMemberId("all")}
            className="mt-2 text-sm text-[var(--accent)] hover:underline"
          >
            Show all entries
          </button>
        </div>
      )}

      {/* Recent entries - full card view */}
      {recentEntries.length > 0 && (
        <div className="space-y-5">
          {recentEntries.map((entry) => {
            const coverUrl = getCoverUrl(entry);
            return (
              <article
                key={entry.id}
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition-shadow hover:shadow-md"
              >
                <div className={coverUrl ? "sm:flex" : ""}>
                  {coverUrl && (
                    <Link
                      href={`/dashboard/journal/${entry.id}`}
                      className="relative block h-48 w-full shrink-0 overflow-hidden bg-[var(--surface)] sm:h-auto sm:w-52"
                    >
                      <Image
                        src={thumbUrl(coverUrl, 416)}
                        alt={entry.title || "Journal entry"}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 208px"
                      />
                      {entry.photos.length > 1 && (
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                          +{entry.photos.length - 1}
                        </span>
                      )}
                    </Link>
                  )}

                  <div className="flex-1 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <time
                        className="text-sm text-[var(--muted)]"
                        dateTime={entry.trip_date || entry.created_at}
                      >
                        {entry.dateFormatted}
                      </time>
                      {entry.location && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--secondary)] px-2 py-0.5 text-xs text-[var(--foreground)]">
                          📍 {entry.location}
                        </span>
                      )}
                      {entry.authorLabel && (
                        <span className="text-sm text-[var(--muted)]">
                          · by {entry.authorLabel}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-2 font-display text-xl font-semibold text-[var(--foreground)]">
                      <Link
                        href={`/dashboard/journal/${entry.id}`}
                        className="hover:text-[var(--accent)]"
                      >
                        {entry.title}
                      </Link>
                    </h2>

                    {entry.content && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--foreground)]/80">
                        {entry.content}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {entry.perspectiveCount > 0 && (
                        <span className="rounded-full bg-[var(--accent)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
                          {entry.perspectiveCount} perspective
                          {entry.perspectiveCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {canEdit(entry) && (
                        <div className="ml-auto flex items-center gap-2">
                          <Link
                            href={`/dashboard/journal/${entry.id}/edit`}
                            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--surface-hover)]"
                          >
                            Edit
                          </Link>
                          <DeleteJournalEntryButton
                            entryId={entry.id}
                            title={entry.title ?? "this entry"}
                            variant="list"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!coverUrl &&
                  (entry.photos.length > 0 || entry.videos.length > 0) && (
                    <div className="border-t border-[var(--border)]">
                      <JournalPhotoGallery
                        photos={entry.photos}
                        videos={entry.videos}
                        title={entry.title || "Photo"}
                      />
                    </div>
                  )}
              </article>
            );
          })}
        </div>
      )}

      {/* Older entries - calendar drill-down: Year > Month > entries */}
      {calendar.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
            Earlier entries
          </h2>
          <div className="space-y-1">
            {calendar.map(({ year, months, entryCount }) => {
              const yearOpen = expandedYears.has(year);
              return (
                <div key={year}>
                  {/* Year row */}
                  <button
                    type="button"
                    onClick={() => toggleYear(year)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <ChevronIcon open={yearOpen} />
                    <span className="font-display text-lg font-semibold text-[var(--foreground)]">
                      {year}
                    </span>
                    <span className="ml-auto text-sm text-[var(--muted)]">
                      {entryCount} {entryCount === 1 ? "entry" : "entries"}
                    </span>
                  </button>

                  {/* Months under this year */}
                  {yearOpen && (
                    <div className="ml-4 space-y-0.5 border-l border-[var(--border)] pl-3">
                      {months.map(({ month, label, entries: monthEntries }) => {
                        const monthKey = `${year}-${month}`;
                        const monthOpen = expandedMonths.has(monthKey);
                        return (
                          <div key={monthKey}>
                            {/* Month row */}
                            <button
                              type="button"
                              onClick={() => toggleMonth(monthKey)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--surface-hover)]"
                            >
                              <ChevronIcon open={monthOpen} />
                              <span className="font-medium text-[var(--foreground)]">
                                {label}
                              </span>
                              <span className="ml-auto text-xs text-[var(--muted)]">
                                {monthEntries.length}
                              </span>
                            </button>

                            {/* Entries under this month */}
                            {monthOpen && (
                              <div className="ml-4 space-y-1 border-l border-[var(--border)] py-1 pl-3">
                                {monthEntries.map((entry) => {
                                  const coverUrl = getCoverUrl(entry);
                                  return (
                                    <Link
                                      key={entry.id}
                                      href={`/dashboard/journal/${entry.id}`}
                                      className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--surface-hover)]"
                                    >
                                      {/* Tiny thumbnail */}
                                      {coverUrl ? (
                                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--surface)]">
                                          <Image
                                            src={thumbUrl(coverUrl, 80)}
                                            alt=""
                                            fill
                                            unoptimized
                                            className="object-cover"
                                            sizes="40px"
                                          />
                                        </div>
                                      ) : (
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--surface)] text-lg">
                                          📔
                                        </div>
                                      )}

                                      {/* Entry info */}
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)]">
                                          {entry.title || "Untitled"}
                                        </p>
                                        <p className="truncate text-xs text-[var(--muted)]">
                                          {formatDayLabel(entry.trip_date || entry.created_at)}
                                          {entry.location ? ` · 📍 ${entry.location}` : ""}
                                          {entry.authorLabel ? ` · ${entry.authorLabel}` : ""}
                                        </p>
                                      </div>

                                      {/* Photo count badge */}
                                      {entry.photos.length > 0 && (
                                        <span className="shrink-0 text-xs text-[var(--muted)]">
                                          {entry.photos.length} 📷
                                        </span>
                                      )}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
