import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { formatDateOnly } from "@/src/lib/date";
import { JournalPhotoGallery } from "../JournalPhotoGallery";
import { JournalPerspectives } from "../JournalPerspectives";
import { DeleteJournalEntryButton } from "../DeleteJournalEntryButton";

export default async function JournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const [entryRes, photosRes, videosRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select(`
        id,
        title,
        content,
        location,
        trip_date,
        trip_date_end,
        created_at,
        family_members!author_id(name, nickname, relationship)
      `)
      .eq("id", id)
      .eq("family_id", activeFamilyId)
      .single(),
    supabase
      .from("journal_photos")
      .select("id, url, caption")
      .eq("entry_id", id)
      .order("sort_order"),
    supabase
      .from("journal_videos")
      .select("id, url, duration_seconds")
      .eq("entry_id", id)
      .order("sort_order"),
  ]);

  if (!entryRes.data) notFound();

  const entry = entryRes.data;
  const photos = photosRes.data ?? [];
  const videos = videosRes.data ?? [];

  const raw = entry.family_members as unknown;
  const author = Array.isArray(raw) ? raw[0] : raw;
  const displayName = (author as { nickname?: string | null; name?: string } | null)?.nickname?.trim()
    || (author as { name?: string } | null)?.name;
  const rel = (author as { relationship?: string | null } | null)?.relationship?.trim();
  const authorLabel = displayName ? (rel ? `${displayName} (${rel})` : displayName) : null;

  const dateStr = entry.trip_date
    ? entry.trip_date_end && entry.trip_date_end !== entry.trip_date
      ? `${formatDateOnly(entry.trip_date)} – ${formatDateOnly(entry.trip_date_end)}`
      : formatDateOnly(entry.trip_date)
    : new Date(entry.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/journal" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Journal
      </Link>

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
          <time dateTime={entry.trip_date || entry.created_at}>{dateStr}</time>
          {entry.location && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--secondary)] px-2 py-0.5 text-xs text-[var(--foreground)]">
              📍 {entry.location}
            </span>
          )}
          {authorLabel && <span>· by {authorLabel}</span>}
        </div>

        <h1 className="mt-2 font-display text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
          {entry.title}
        </h1>

        {entry.content && (
          <div className="mt-6 whitespace-pre-wrap leading-relaxed text-[var(--foreground)]/90">
            {entry.content}
          </div>
        )}
      </div>

      {(photos.length > 0 || videos.length > 0) && (
        <div className="mt-8 overflow-hidden rounded-xl border border-[var(--border)]">
          <JournalPhotoGallery
            photos={photos}
            videos={videos.map((v) => ({ id: v.id, url: v.url, duration_seconds: v.duration_seconds }))}
            title={entry.title || "Photo"}
          />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href={`/dashboard/journal/${id}/edit`}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-hover)]"
        >
          Edit
        </Link>
        <DeleteJournalEntryButton entryId={id} title={entry.title ?? "this entry"} variant="list" />
      </div>

      <JournalPerspectives entryId={id} />
    </div>
  );
}
