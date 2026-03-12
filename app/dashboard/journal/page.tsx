import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Family Journal — Family Nest",
};
import { createClient } from "@/src/lib/supabase/server";
import { formatDateOnly } from "@/src/lib/date";
import { getActiveFamilyId } from "@/src/lib/family";
import { EmptyState } from "@/app/dashboard/components/EmptyState";
import { AddedToMapBanner } from "./AddedToMapBanner";
import { ScrollToTop } from "./ScrollToTop";
import { JournalListClient, type JournalEntryData, type FamilyMemberInfo } from "./JournalListClient";

export default async function JournalPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: { user } } = await supabase.auth.getUser();
  const { data: myMember } = user
    ? await supabase
        .from("family_members")
        .select("id, role")
        .eq("user_id", user.id)
        .eq("family_id", activeFamilyId)
        .single()
    : { data: null };

  // Fetch all family members for the filter dropdown
  const { data: allMembers } = await supabase
    .from("family_members")
    .select("id, name, nickname")
    .eq("family_id", activeFamilyId)
    .order("name");

  const { data: entries } = await supabase
    .from("journal_entries")
    .select(`
      id,
      title,
      content,
      location,
      trip_date,
      created_at,
      author_id,
      created_by,
      cover_photo_id,
      family_members!author_id (name, nickname, relationship)
    `)
    .eq("family_id", activeFamilyId)
    .order("trip_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  // Batch fetch photos, videos, perspective counts, and member junctions
  const photosByEntryId = new Map<string, { id: string; url: string; caption: string | null }[]>();
  const videosByEntryId = new Map<string, { id: string; url: string; duration_seconds: number | null }[]>();
  const perspectiveCountByEntryId = new Map<string, number>();
  const membersByEntryId = new Map<string, string[]>();

  if (entries && entries.length > 0) {
    const entryIds = entries.map((e) => e.id);
    const [photosRes, videosRes, perspectivesRes, junctionRes] = await Promise.all([
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
      supabase
        .from("journal_perspectives")
        .select("id, journal_entry_id")
        .in("journal_entry_id", entryIds),
      supabase
        .from("journal_entry_members")
        .select("journal_entry_id, family_member_id")
        .in("journal_entry_id", entryIds),
    ]);

    for (const p of photosRes.data ?? []) {
      if (p.entry_id) {
        const list = photosByEntryId.get(p.entry_id) ?? [];
        list.push({ id: p.id, url: p.url, caption: p.caption });
        photosByEntryId.set(p.entry_id, list);
      }
    }
    for (const v of videosRes.data ?? []) {
      if (v.entry_id) {
        const list = videosByEntryId.get(v.entry_id) ?? [];
        list.push({ id: v.id, url: v.url, duration_seconds: v.duration_seconds });
        videosByEntryId.set(v.entry_id, list);
      }
    }
    for (const p of perspectivesRes.data ?? []) {
      if (p.journal_entry_id) {
        perspectiveCountByEntryId.set(
          p.journal_entry_id,
          (perspectiveCountByEntryId.get(p.journal_entry_id) ?? 0) + 1
        );
      }
    }
    for (const j of junctionRes.data ?? []) {
      if (j.journal_entry_id) {
        const list = membersByEntryId.get(j.journal_entry_id) ?? [];
        list.push(j.family_member_id);
        membersByEntryId.set(j.journal_entry_id, list);
      }
    }
  }

  // Build serializable entry data
  const entryData: JournalEntryData[] = (entries ?? []).map((entry) => {
    const raw = entry.family_members as unknown;
    const author = Array.isArray(raw) ? raw[0] : raw;
    const displayName = author?.nickname?.trim() || author?.name;
    const rel = author?.relationship?.trim();
    const authorLabel = displayName ? (rel ? `${displayName} (${rel})` : displayName) : null;

    const dateFormatted = entry.trip_date
      ? formatDateOnly(entry.trip_date)
      : new Date(entry.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

    return {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      location: entry.location,
      trip_date: entry.trip_date,
      created_at: entry.created_at,
      author_id: entry.author_id,
      created_by: entry.created_by,
      cover_photo_id: entry.cover_photo_id,
      authorLabel,
      authorMemberId: entry.author_id,
      dateFormatted,
      photos: photosByEntryId.get(entry.id) ?? [],
      videos: videosByEntryId.get(entry.id) ?? [],
      perspectiveCount: perspectiveCountByEntryId.get(entry.id) ?? 0,
      memberIds: membersByEntryId.get(entry.id) ?? [],
    };
  });

  const membersInfo: FamilyMemberInfo[] = (allMembers ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    nickname: m.nickname,
  }));

  return (
    <div>
      <ScrollToTop />
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

      {!entries?.length ? (
        <EmptyState
          icon="📔"
          headline="Your first entry is waiting to be written"
          description="Trips, birthdays, regular Tuesdays that turned into something — it all belongs here. Future you will be so glad you started."
          actionLabel="+ Write your first entry"
          actionHref="/dashboard/journal/new"
        />
      ) : (
        <JournalListClient
          entries={entryData}
          members={membersInfo}
          myMemberId={myMember?.id ?? null}
          myRole={myMember?.role ?? null}
        />
      )}
    </div>
  );
}
