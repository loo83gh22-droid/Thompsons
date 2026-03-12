"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { thumbUrl } from "@/src/lib/imageUrl";
import { UI_DISPLAY } from "@/src/lib/constants";
import { CalendarDrillDown } from "@/app/components/CalendarDrillDown";
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

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getCoverUrl(entry: JournalEntryData): string | null {
  if (entry.cover_photo_id) {
    const coverPhoto = entry.photos.find((p) => p.id === entry.cover_photo_id);
    if (coverPhoto) return coverPhoto.url;
  }
  if (entry.photos.length > 0) return entry.photos[0].url;
  return null;
}

/* ── Compact row for calendar drill-down ──────────────────── */

function JournalCompactRow({ entry }: { entry: JournalEntryData }) {
  const coverUrl = getCoverUrl(entry);
  return (
    <Link
      href={`/dashboard/journal/${entry.id}`}
      className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--surface-hover)]"
    >
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
      {entry.photos.length > 0 && (
        <span className="shrink-0 text-xs text-[var(--muted)]">
          {entry.photos.length} 📷
        </span>
      )}
    </Link>
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

  const filteredEntries = useMemo(() => {
    if (filterMemberId === "all") return entries;
    return entries.filter(
      (e) =>
        e.authorMemberId === filterMemberId ||
        e.memberIds.includes(filterMemberId)
    );
  }, [entries, filterMemberId]);

  const recentEntries = filteredEntries.slice(0, UI_DISPLAY.recentFullCardCount);
  const olderEntries = filteredEntries.slice(UI_DISPLAY.recentFullCardCount);

  const getEntryDate = useCallback(
    (e: JournalEntryData) => new Date(e.trip_date || e.created_at),
    []
  );

  function canEdit(entry: JournalEntryData): boolean {
    const isOwner = myRole === "owner";
    const isCreator = entry.created_by
      ? entry.created_by === myMemberId
      : entry.author_id === myMemberId;
    return isOwner || isCreator;
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

      {/* Older entries - calendar drill-down */}
      <CalendarDrillDown
        items={olderEntries}
        getDate={getEntryDate}
        renderCompactRow={(entry) => <JournalCompactRow entry={entry} />}
      />
    </div>
  );
}
