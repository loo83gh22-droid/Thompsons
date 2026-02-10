import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { TimelineClient } from "./TimelineClient";

export type TimelineItem = {
  id: string;
  date: string;
  type: "journal" | "voice_memo" | "time_capsule" | "photo";
  title: string;
  description: string | null;
  authorName: string | null;
  authorMemberId: string | null;
  thumbnailUrl: string | null;
  href: string;
};

export default async function TimelinePage({
  searchParams,
}: {
  searchParams?: { member?: string };
}) {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const items: TimelineItem[] = [];

  const [journalRes, voiceRes, timeCapsulesRes, photosRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select(`
        id,
        title,
        content,
        trip_date,
        created_at,
        author_id,
        family_members!author_id(name)
      `)
      .eq("family_id", activeFamilyId)
      .order("trip_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("voice_memos")
      .select(`
        id,
        title,
        description,
        created_at,
        family_member_id,
        family_members(name)
      `)
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("time_capsules")
      .select(`
        id,
        title,
        created_at,
        from_family_member_id,
        family_members!from_family_member_id(name)
      `)
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("home_mosaic_photos")
      .select("id, url, created_at")
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const authorName = (raw: unknown) => {
    const r = raw as { name: string } | { name: string }[] | null;
    if (!r) return null;
    const one = Array.isArray(r) ? r[0] : r;
    return one?.name ?? null;
  };

  for (const row of journalRes.data ?? []) {
    const date = row.trip_date ?? row.created_at?.slice(0, 10) ?? "";
    items.push({
      id: row.id,
      date,
      type: "journal",
      title: row.title ?? "Journal entry",
      description: row.content?.slice(0, 120) ?? null,
      authorName: authorName(row.family_members),
      authorMemberId: row.author_id ?? null,
      thumbnailUrl: null,
      href: `/dashboard/journal/${row.id}/edit`,
    });
  }

  for (const row of voiceRes.data ?? []) {
    items.push({
      id: row.id,
      date: row.created_at?.slice(0, 10) ?? "",
      type: "voice_memo",
      title: row.title ?? "Voice memo",
      description: row.description ?? null,
      authorName: authorName(row.family_members),
      authorMemberId: row.family_member_id ?? null,
      thumbnailUrl: null,
      href: "/dashboard/voice-memos",
    });
  }

  for (const row of timeCapsulesRes.data ?? []) {
    items.push({
      id: row.id,
      date: row.created_at?.slice(0, 10) ?? "",
      type: "time_capsule",
      title: row.title ?? "Time capsule",
      description: "Letter for the future",
      authorName: authorName(row.family_members),
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
      authorMemberId: null,
      thumbnailUrl: row.url ?? null,
      href: "/dashboard/photos",
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
        Family Timeline
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        All family memories in one place—journal entries, photos, voice memos, and time capsules. Filter by date, member, or type.
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
