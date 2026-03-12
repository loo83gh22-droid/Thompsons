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

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/* ── Component ─────────────────────────────────────────────── */

export function JournalListClient({
  entries,
  members,
  myMemberId,
  myRole,
}: JournalListClientProps) {
  const [viewMode, setViewMode] = useState<"cards" | "grid">("cards");
  const [filterMemberId, setFilterMemberId] = useState<string>("all");

  // Filter entries by selected member
  const filteredEntries = useMemo(() => {
    if (filterMemberId === "all") return entries;
    return entries.filter(
      (e) =>
        e.authorMemberId === filterMemberId ||
        e.memberIds.includes(filterMemberId)
    );
  }, [entries, filterMemberId]);

  // Split into recent (card view) and older (grid/calendar view)
  const recentEntries = filteredEntries.slice(0, 10);
  const olderEntries = filteredEntries.slice(10);

  // Group older entries by month
  const olderByMonth = useMemo(() => {
    const groups = new Map<string, JournalEntryData[]>();
    for (const entry of olderEntries) {
      const key = getMonthKey(entry.trip_date || entry.created_at);
      const list = groups.get(key) ?? [];
      list.push(entry);
      groups.set(key, list);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [olderEntries]);

  function getCoverUrl(entry: JournalEntryData): string | null {
    if (entry.cover_photo_id) {
      const coverPhoto = entry.photos.find((p) => p.id === entry.cover_photo_id);
      if (coverPhoto) return coverPhoto.url;
    }
    // Fallback to first photo
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

  return (
    <div>
      {/* Toolbar: filter + view toggle */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Person filter */}
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

        {/* View toggle - only show if there are older entries */}
        {filteredEntries.length > 10 && (
          <div className="ml-auto flex items-center rounded-lg border border-[var(--border)] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                viewMode === "cards"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Grid
            </button>
          </div>
        )}
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

      {/* Recent entries - rich card view */}
      {recentEntries.length > 0 && (
        <div className="space-y-5">
          {viewMode === "cards" && recentEntries.length > 0 && filteredEntries.length > 10 && (
            <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
              Recent
            </h2>
          )}
          {recentEntries.map((entry) => {
            const coverUrl = getCoverUrl(entry);
            return (
              <article
                key={entry.id}
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition-shadow hover:shadow-md"
              >
                {/* Cover photo + card body in a row on desktop */}
                <div className={coverUrl ? "sm:flex" : ""}>
                  {/* Cover photo */}
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

                  {/* Card body */}
                  <div className="flex-1 p-5 sm:p-6">
                    {/* Metadata row */}
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

                    {/* Title */}
                    <h2 className="mt-2 font-display text-xl font-semibold text-[var(--foreground)]">
                      <Link
                        href={`/dashboard/journal/${entry.id}`}
                        className="hover:text-[var(--accent)]"
                      >
                        {entry.title}
                      </Link>
                    </h2>

                    {/* Content preview */}
                    {entry.content && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--foreground)]/80">
                        {entry.content}
                      </p>
                    )}

                    {/* Actions row */}
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

                {/* Media thumbnails for entries WITHOUT a cover photo */}
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

      {/* Older entries - grouped by month in compact grid */}
      {olderEntries.length > 0 && (
        <div className="mt-10">
          {viewMode === "cards" ? (
            /* Card view for all older entries */
            <div className="space-y-5">
              <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
                Older entries
              </h2>
              {olderEntries.map((entry) => {
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
                        </Link>
                      )}
                      <div className="flex-1 p-5 sm:p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <time className="text-sm text-[var(--muted)]">{entry.dateFormatted}</time>
                          {entry.location && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--secondary)] px-2 py-0.5 text-xs">
                              📍 {entry.location}
                            </span>
                          )}
                          {entry.authorLabel && (
                            <span className="text-sm text-[var(--muted)]">· by {entry.authorLabel}</span>
                          )}
                        </div>
                        <h2 className="mt-2 font-display text-xl font-semibold text-[var(--foreground)]">
                          <Link href={`/dashboard/journal/${entry.id}`} className="hover:text-[var(--accent)]">
                            {entry.title}
                          </Link>
                        </h2>
                        {entry.content && (
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--foreground)]/80">
                            {entry.content}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {entry.perspectiveCount > 0 && (
                            <span className="rounded-full bg-[var(--accent)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
                              {entry.perspectiveCount} perspective{entry.perspectiveCount !== 1 ? "s" : ""}
                            </span>
                          )}
                          {canEdit(entry) && (
                            <div className="ml-auto flex items-center gap-2">
                              <Link href={`/dashboard/journal/${entry.id}/edit`} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--surface-hover)]">
                                Edit
                              </Link>
                              <DeleteJournalEntryButton entryId={entry.id} title={entry.title ?? "this entry"} variant="list" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* Grid view grouped by month */
            <div className="space-y-8">
              {olderByMonth.map(([monthKey, monthEntries]) => (
                <div key={monthKey}>
                  <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
                    {formatMonthLabel(monthKey)}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {monthEntries.map((entry) => {
                      const coverUrl = getCoverUrl(entry);
                      return (
                        <Link
                          key={entry.id}
                          href={`/dashboard/journal/${entry.id}`}
                          className="group relative flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] transition-shadow hover:shadow-md"
                        >
                          {/* Thumbnail */}
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--surface)]">
                            {coverUrl ? (
                              <Image
                                src={thumbUrl(coverUrl, 320)}
                                alt={entry.title || "Journal entry"}
                                fill
                                unoptimized
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-3xl">
                                📔
                              </div>
                            )}
                            {entry.photos.length > 1 && (
                              <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                {entry.photos.length} 📷
                              </span>
                            )}
                          </div>
                          {/* Info */}
                          <div className="flex-1 p-2.5">
                            <p className="text-[11px] text-[var(--muted)]">
                              {entry.dateFormatted}
                            </p>
                            <h4 className="mt-0.5 line-clamp-2 text-sm font-medium leading-tight text-[var(--foreground)] group-hover:text-[var(--accent)]">
                              {entry.title}
                            </h4>
                            {entry.location && (
                              <p className="mt-1 text-[11px] text-[var(--muted)] truncate">
                                📍 {entry.location}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
