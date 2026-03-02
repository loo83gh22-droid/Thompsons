import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Family Journal — Family Nest",
};
import { createClient } from "@/src/lib/supabase/server";
import { formatDateOnly } from "@/src/lib/date";
import { getActiveFamilyId } from "@/src/lib/family";
import { DeleteJournalEntryButton } from "./DeleteJournalEntryButton";
import { EmptyState } from "@/app/dashboard/components/EmptyState";
import { AddedToMapBanner } from "./AddedToMapBanner";
import { JournalPhotoGallery } from "./JournalPhotoGallery";

export default async function JournalPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: entries } = await supabase
    .from("journal_entries")
    .select(`
      id,
      title,
      content,
      location,
      trip_date,
      created_at,
      family_members!author_id (name, nickname, relationship)
    `)
    .eq("family_id", activeFamilyId)
    .order("trip_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  // Batch fetch photos, videos, and perspective counts
  const photosByEntryId = new Map<string, { id: string; url: string; caption: string | null }[]>();
  const videosByEntryId = new Map<string, { id: string; url: string; duration_seconds: number | null }[]>();
  const perspectiveCountByEntryId = new Map<string, number>();
  if (entries && entries.length > 0) {
    const entryIds = entries.map((e) => e.id);
    const [photosRes, videosRes, perspectivesRes] = await Promise.all([
      supabase
        .from("journal_photos")
        .select("id, url, caption, entry_id")
        .in("entry_id", entryIds)
        .order("entry_id")
        .order("sort_order"),
      supabase
        .from("journal_videos")
        .select("id, url, duration_seconds, entry_id")
        .in("entry_id", entryIds)
        .order("entry_id")
        .order("sort_order"),
      supabase.from("journal_perspectives").select("id, journal_entry_id").in("journal_entry_id", entryIds),
    ]);
    const photos = photosRes.data ?? [];
    const videos = videosRes.data ?? [];
    const perspectives = perspectivesRes.data ?? [];
    for (const p of photos) {
      if (p.entry_id) {
        const list = photosByEntryId.get(p.entry_id) ?? [];
        list.push({ id: p.id, url: p.url, caption: p.caption });
        photosByEntryId.set(p.entry_id, list);
      }
    }
    for (const v of videos) {
      if (v.entry_id) {
        const list = videosByEntryId.get(v.entry_id) ?? [];
        list.push({ id: v.id, url: v.url, duration_seconds: v.duration_seconds });
        videosByEntryId.set(v.entry_id, list);
      }
    }
    for (const p of perspectives) {
      if (p.journal_entry_id) {
        perspectiveCountByEntryId.set(p.journal_entry_id, (perspectiveCountByEntryId.get(p.journal_entry_id) ?? 0) + 1);
      }
    }
  }

  return (
    <div>
      <Suspense fallback={null}>
        <AddedToMapBanner />
      </Suspense>

      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Journal</h1>
          <p className="mt-2 text-[var(--muted)]">
            Stories and photos from trips, birthdays, celebrations. Anyone can add their perspective to an entry.
          </p>
        </div>
        <Link
          href="/dashboard/journal/new"
          className="shrink-0 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--primary)] px-5 py-2 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          + New entry
        </Link>
      </div>

      <div className="mt-4 space-y-6">
        {!entries?.length ? (
          <EmptyState
            icon="📔"
            headline="Your first entry is waiting to be written"
            description="Trips, birthdays, regular Tuesdays that turned into something — it all belongs here. Future you will be so glad you started."
            actionLabel="+ Write your first entry"
            actionHref="/dashboard/journal/new"
          />
        ) : (
          entries.map((entry) => {
            const photos = photosByEntryId.get(entry.id) ?? [];
            const videos = videosByEntryId.get(entry.id) ?? [];
            const perspectiveCount = perspectiveCountByEntryId.get(entry.id) ?? 0;

            const date = entry.trip_date
              ? formatDateOnly(entry.trip_date)
              : new Date(entry.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

            const raw = entry.family_members as unknown;
            const author = Array.isArray(raw) ? raw[0] : raw;
            const displayName = author?.nickname?.trim() || author?.name;
            const rel = author?.relationship?.trim();
            const authorLabel = displayName ? (rel ? `${displayName} (${rel})` : displayName) : null;

            return (
              <article
                key={entry.id}
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-shadow hover:shadow-md"
              >
                {/* Card body */}
                <div className="p-5 sm:p-6">
                  {/* Metadata row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <time className="text-sm text-[var(--muted)]" dateTime={entry.trip_date || entry.created_at}>
                      {date}
                    </time>
                    {entry.location && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--secondary)] px-2 py-0.5 text-xs text-[var(--foreground)]">
                        📍 {entry.location}
                      </span>
                    )}
                    {authorLabel && (
                      <span className="text-sm text-[var(--muted)]">· by {authorLabel}</span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="mt-2 font-display text-xl font-semibold text-[var(--foreground)]">
                    {entry.title}
                  </h2>

                  {/* Content preview */}
                  {entry.content && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--foreground)]/80">
                      {entry.content}
                    </p>
                  )}

                  {/* Actions row */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {perspectiveCount > 0 && (
                      <span className="rounded-full bg-[var(--accent)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
                        {perspectiveCount} perspective{perspectiveCount !== 1 ? "s" : ""}
                      </span>
                    )}
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
                  </div>
                </div>

                {/* Unified media thumbnails — photos + videos, click to open lightbox */}
                {(photos.length > 0 || videos.length > 0) && (
                  <div className="border-t border-[var(--border)]">
                    <JournalPhotoGallery photos={photos} videos={videos} title={entry.title || "Photo"} />
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
