import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { QUERY_LIMITS } from "@/src/lib/constants";
import { TimelineClient } from "./TimelineClient";
import type { TimelineItem } from "./types";

export type { TimelineItem } from "./types";

function one<T>(x: T | T[] | null): T | null {
  return x == null ? null : Array.isArray(x) ? x[0] ?? null : x;
}

function authorDisplay(raw: { name: string; nickname?: string | null; relationship?: string | null } | unknown): { name: string | null; relationship: string | null } {
  const r = raw as { name: string; nickname?: string | null; relationship?: string | null } | { name: string; nickname?: string | null; relationship?: string | null }[] | null;
  if (!r) return { name: null, relationship: null };
  const single = one(r);
  if (!single) return { name: null, relationship: null };
  const name = single.nickname?.trim() || single.name || null;
  return { name, relationship: single.relationship?.trim() ?? null };
}

export default async function TimelinePage({
  searchParams,
}: {
  searchParams?: { member?: string };
}) {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const items: TimelineItem[] = [];

  const [journalRes, voiceRes, timeCapsulesRes, photosRes, messagesRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id, title, content, trip_date, created_at, author_id, family_members!author_id(name, nickname, relationship)")
      .eq("family_id", activeFamilyId)
      .order("trip_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(QUERY_LIMITS.timelineItemsPerType),
    supabase
      .from("voice_memos")
      .select("id, title, description, created_at, family_member_id, audio_url, duration_seconds, family_members!family_member_id(name, nickname, relationship)")
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false })
      .limit(QUERY_LIMITS.timelineItemsPerType),
    supabase
      .from("time_capsules")
      .select("id, title, created_at, from_family_member_id, family_members!from_family_member_id(name, nickname, relationship)")
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false })
      .limit(QUERY_LIMITS.timelineItemsPerType),
    supabase
      .from("home_mosaic_photos")
      .select("id, url, created_at")
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false })
      .limit(QUERY_LIMITS.timelineItemsPerType),
    supabase
      .from("family_messages")
      .select("id, title, content, created_at, sender_id, family_members!sender_id(name, nickname, relationship)")
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false })
      .limit(QUERY_LIMITS.timelineItemsPerType),
  ]);

  for (const row of journalRes.data ?? []) {
    const date = row.trip_date ?? row.created_at?.slice(0, 10) ?? "";
    const { name, relationship } = authorDisplay(row.family_members);
    items.push({
      id: row.id,
      date,
      type: "journal",
      title: row.title ?? "Journal entry",
      description: row.content?.slice(0, 120) ?? null,
      authorName: name,
      authorRelationship: relationship,
      authorMemberId: row.author_id ?? null,
      thumbnailUrl: null,
      href: `/dashboard/journal/${row.id}/edit`,
    });
  }

  for (const row of voiceRes.data ?? []) {
    const { name, relationship } = authorDisplay(row.family_members);
    items.push({
      id: row.id,
      date: row.created_at?.slice(0, 10) ?? "",
      type: "voice_memo",
      title: row.title ?? "Voice memo",
      description: row.description ?? null,
      authorName: name,
      authorRelationship: relationship,
      authorMemberId: row.family_member_id ?? null,
      thumbnailUrl: null,
      href: "/dashboard/voice-memos",
      durationSeconds: row.duration_seconds ?? null,
      audioUrl: row.audio_url ?? null,
    });
  }

  for (const row of timeCapsulesRes.data ?? []) {
    const { name, relationship } = authorDisplay(row.family_members);
    items.push({
      id: row.id,
      date: row.created_at?.slice(0, 10) ?? "",
      type: "time_capsule",
      title: row.title ?? "Time capsule",
      description: "Letter for the future",
      authorName: name,
      authorRelationship: relationship,
      authorMemberId: row.from_family_member_id ?? null,
      thumbnailUrl: null,
      href: `/dashboard/time-capsules/${row.id}`,
    });
  }

  for (const row of photosRes.data ?? []) {
    items.push({
      id: row.id,
      date: row.created_at?.slice(0, 10) ?? "",
      type: "photo",
      title: "Photo",
      description: null,
      authorName: null,
      authorRelationship: null,
      authorMemberId: null,
      thumbnailUrl: row.url ?? null,
      href: "/dashboard/photos",
    });
  }

  for (const row of messagesRes.data ?? []) {
    const { name, relationship } = authorDisplay(row.family_members);
    items.push({
      id: row.id,
      date: row.created_at?.slice(0, 10) ?? "",
      type: "message",
      title: row.title ?? "Message",
      description: row.content?.slice(0, 120) ?? null,
      authorName: name,
      authorRelationship: relationship,
      authorMemberId: row.sender_id ?? null,
      thumbnailUrl: null,
      href: "/dashboard/messages",
    });
  }

  items.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

  const membersRes = await supabase
    .from("family_members")
    .select("id, name")
    .eq("family_id", activeFamilyId)
    .order("name");
  const members = membersRes.data ?? [];

  const today = new Date();
  const thisDay = today.getDate();
  const thisMonth = today.getMonth();
  const thisDayItems = items.filter((i) => {
    const d = new Date(i.date + "T12:00:00");
    return d.getDate() === thisDay && d.getMonth() === thisMonth && d.getFullYear() !== today.getFullYear();
  });

  const initialMember = typeof searchParams?.member === "string" ? searchParams.member : undefined;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        Timeline
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        All family memories in one chronological view
      </p>

      <TimelineClient
        initialItems={items}
        members={members}
        thisDayItems={thisDayItems}
        initialFilterMemberId={initialMember}
      />
    </div>
  );
}
