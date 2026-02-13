import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Family Nest — Dashboard",
};
import { getActiveFamilyId } from "@/src/lib/family";
import { DashboardStats } from "./DashboardStats";
import { UpcomingEvents } from "./UpcomingEvents";
import { ActivityFeed, type ActivityItem } from "./ActivityFeed";
import { FamilySummaryStrip } from "./FamilySummaryStrip";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);

  let stats = {
    memberCount: 0,
    photoCount: 0,
    journalCount: 0,
    voiceMemoCount: 0,
    timeCapsuleCount: 0,
    storyCount: 0,
    lastActivityBy: null as string | null,
    lastActivityAt: null as string | null,
  };
  let upcomingEvents: { id: string; title: string; event_date: string; category: string }[] = [];
  let activityItems: ActivityItem[] = [];
  let activityHasMore = false;
  let summaryMembers: { id: string; name: string; avatar_url: string | null }[] = [];
  let hasNoContent = false;

  if (activeFamilyId) {
    const [
      membersListRes,
      membersRes,
      photosRes,
      journalRes,
      voiceRes,
      capsulesRes,
      storiesRes,
      eventsRes,
      photosActivity,
      journalActivity,
      voiceActivity,
      messagesActivity,
    ] = await Promise.all([
      supabase.from("family_members").select("id, name, avatar_url").eq("family_id", activeFamilyId).order("name").limit(12),
      supabase.from("family_members").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("home_mosaic_photos").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("voice_memos").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("time_capsules").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("family_stories").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId).eq("published", true),
      supabase.from("family_events").select("id, title, event_date, category").eq("family_id", activeFamilyId).gte("event_date", new Date().toISOString().slice(0, 10)).lte("event_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)).order("event_date", { ascending: true }).limit(10),
      supabase.from("home_mosaic_photos").select("id, url, created_at").eq("family_id", activeFamilyId).order("created_at", { ascending: false }).limit(10),
      supabase.from("journal_entries").select("id, title, created_at, family_members!author_id(name, nickname, relationship)").eq("family_id", activeFamilyId).order("created_at", { ascending: false }).limit(10),
      supabase.from("voice_memos").select("id, title, created_at, duration_seconds, family_members!family_member_id(name, nickname, relationship)").eq("family_id", activeFamilyId).order("created_at", { ascending: false }).limit(10),
      supabase.from("family_messages").select("id, title, created_at, family_members!sender_id(name, nickname, relationship)").eq("family_id", activeFamilyId).order("created_at", { ascending: false }).limit(10),
    ]);

    stats = {
      memberCount: membersRes.count ?? 0,
      photoCount: photosRes.count ?? 0,
      journalCount: journalRes.count ?? 0,
      voiceMemoCount: voiceRes.count ?? 0,
      timeCapsuleCount: capsulesRes.count ?? 0,
      storyCount: storiesRes.count ?? 0,
      lastActivityBy: null,
      lastActivityAt: null,
    };
    upcomingEvents = eventsRes.data ?? [];

    const one = <T,>(x: T | T[] | null): T | null => (x == null ? null : Array.isArray(x) ? x[0] ?? null : x);

    const photoRows = (photosActivity.data ?? []).map((p: { id: string; url: string; created_at: string }) => ({
      type: "photo" as const,
      id: p.id,
      createdAt: p.created_at,
      title: null,
      thumbnailUrl: p.url,
      memberName: null,
      memberRelationship: null,
      durationSeconds: null,
      href: "/dashboard/photos",
    }));

    const journalRows = (journalActivity.data ?? []).map((j: { id: string; title: string; created_at: string; family_members: { name: string; nickname: string | null; relationship: string | null } | { name: string; nickname: string | null; relationship: string | null }[] | null }) => {
      const author = one(j.family_members);
      return {
        type: "journal" as const,
        id: j.id,
        createdAt: j.created_at,
        title: j.title,
        thumbnailUrl: null,
        memberName: author ? (author.nickname?.trim() || author.name) : null,
        memberRelationship: author?.relationship ?? null,
        durationSeconds: null,
        href: `/dashboard/journal/${j.id}/edit`,
      };
    });

    const voiceRows = (voiceActivity.data ?? []).map((v: { id: string; title: string; created_at: string; duration_seconds: number | null; family_members: { name: string; nickname: string | null; relationship: string | null } | { name: string; nickname: string | null; relationship: string | null }[] | null }) => {
      const by = one(v.family_members);
      return {
        type: "voice_memo" as const,
        id: v.id,
        createdAt: v.created_at,
        title: v.title,
        thumbnailUrl: null,
        memberName: by ? (by.nickname?.trim() || by.name) : null,
        memberRelationship: by?.relationship ?? null,
        durationSeconds: v.duration_seconds ?? null,
        href: "/dashboard/voice-memos",
      };
    });

    const messageRows = (messagesActivity.data ?? []).map((m: { id: string; title: string; created_at: string; family_members: { name: string; nickname: string | null; relationship: string | null } | { name: string; nickname: string | null; relationship: string | null }[] | null }) => {
      const sender = one(m.family_members);
      return {
        type: "message" as const,
        id: m.id,
        createdAt: m.created_at,
        title: m.title,
        thumbnailUrl: null,
        memberName: sender ? (sender.nickname?.trim() || sender.name) : null,
        memberRelationship: sender?.relationship ?? null,
        durationSeconds: null,
        href: "/dashboard/messages",
      };
    });

    const combined = [...photoRows, ...journalRows, ...voiceRows, ...messageRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    activityHasMore = combined.length > 10;
    activityItems = combined.slice(0, 10);
    summaryMembers = membersListRes.data ?? [];

    const first = activityItems[0];
    if (first) {
      stats.lastActivityAt = first.createdAt;
      stats.lastActivityBy = first.memberName ?? null;
    }
    hasNoContent = stats.photoCount === 0 && stats.journalCount === 0 && stats.voiceMemoCount === 0;
  }

  return (
    <div className="min-w-0 w-full overflow-x-hidden">
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        Welcome home
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Your family hub. Pick a destination below.
      </p>

      {activeFamilyId && (
        <>
          {hasNoContent && (
            <div className="mt-6 rounded-xl border-2 border-dashed border-[var(--accent)]/40 bg-[var(--accent)]/5 px-4 py-6 text-center sm:px-6">
              <p className="font-display text-xl font-semibold text-[var(--foreground)]">
                Your family story starts here!
              </p>
              <p className="mt-2 text-[var(--muted)]">
                Choose a section below to add your first memory.
              </p>
            </div>
          )}

          <div className="mt-6">
            <FamilySummaryStrip
              members={summaryMembers}
              photoCount={stats.photoCount}
              journalCount={stats.journalCount}
              voiceMemoCount={stats.voiceMemoCount}
              lastActivityAt={stats.lastActivityAt}
            />
          </div>

          <section className="mt-8" aria-labelledby="activity-heading">
            <div className="flex flex-col gap-2 min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between">
              <div>
                <h2 id="activity-heading" className="font-display text-xl font-semibold text-[var(--foreground)]">
                  Recent Activity
                </h2>
                <p className="mt-0.5 text-sm text-[var(--muted)]">
                  See what your family has been up to
                </p>
              </div>
              <Link
                href="/dashboard/timeline"
                className="shrink-0 text-sm font-medium text-[var(--accent)] hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-4">
              <ActivityFeed items={activityItems} hasMore={activityHasMore} />
            </div>
          </section>

          <div className="mt-10 grid grid-cols-1 gap-6 min-[900px]:grid-cols-3">
            <div className="min-[900px]:col-span-2">
              <DashboardStats stats={stats} />
            </div>
            <div>
              <UpcomingEvents events={upcomingEvents} />
            </div>
          </div>
        </>
      )}

      <div className={`mt-12 w-full max-w-full grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 ${hasNoContent ? "ring-2 ring-[var(--accent)]/30 ring-offset-2 ring-offset-[var(--background)] rounded-xl" : ""}`}>
        <DashboardCard href="/dashboard/timeline" title="Timeline" description="All family memories in one chronological view. Journal, photos, voice memos, time capsules." icon="📅" />
        <DashboardCard href="/dashboard/events" title="Events" description="Birthdays, anniversaries, reunions. Create events and send celebratory messages." icon="🎂" />
        <DashboardCard href="/dashboard/stories" title="Stories" description="Longer-form family history, advice, and memorable moments. Write and share stories." icon="📖" />
        <DashboardCard href="/dashboard/map" title="Family Map" description="See where the family has been. Add your own pins." icon="🗺️" />
        <DashboardCard href="/dashboard/journal" title="Journal" description="Trips, birthdays, celebrations. Add photos. Others can add their perspective to any entry." icon="📔" />
        <DashboardCard href="/dashboard/photos" title="Photos" description="All uploaded photos can be found here and these are used to complete your background mosaics." icon="🖼️" />
        <DashboardCard href="/dashboard/voice-memos" title="Voice Memos" description="Record voices for the future—stories, songs, jokes. Preserve personality." icon="🎙️" />
        <DashboardCard href="/dashboard/time-capsules" title="Time Capsules" description="Write letters for the future. Seal them until a date like &quot;Read when you turn 18.&quot;" icon="📮" />
        <DashboardCard href="/dashboard/recipes" title="Recipes" description="The story behind the food — who taught it, what occasions, photos from dinners." icon="🍳" />
        <DashboardCard href="/dashboard/traditions" title="Traditions" description="Taco Tuesday chants, holiday rituals, inside jokes — the cultural DNA that gets lost." icon="🏠" />
        <DashboardCard href="/dashboard/favourites" title="Favourites" description="Books, movies, shows, games — the stuff we love." icon="⭐" />
        <DashboardCard href="/dashboard/our-family" title="Our Family" description="See your family connections and manage members. Tree view and list." icon="👨‍👩‍👧‍👦" />
        <DashboardCard href="/dashboard/messages" title="Messages" description="Send a message that pops up when family logs in. Perfect for Valentine's Day!" icon="💌" />
        <DashboardCard href="/dashboard/death-box" title="Da Box" description="Sensitive documents and wishes. Password protected." icon="📦" />
      </div>
    </div>
  );
}

function DashboardCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group block min-w-0 min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] md:transition-all md:duration-[250ms] md:ease-in-out md:hover:scale-[1.02] md:hover:border-[var(--accent)]/50 md:hover:bg-[var(--surface-hover)] md:hover:shadow-xl md:hover:shadow-black/25"
    >
      <span className="text-3xl" role="img" aria-hidden="true">{icon}</span>
      <h2 className="mt-4 font-display text-xl font-semibold text-[var(--foreground)] break-words md:group-hover:text-[var(--accent)]">
        {title}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)] break-words">{description}</p>
    </Link>
  );
}
