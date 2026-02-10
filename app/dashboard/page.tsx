import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { DashboardStats } from "./DashboardStats";
import { DashboardAchievements } from "./DashboardAchievements";
import { UpcomingEvents } from "./UpcomingEvents";

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

  if (activeFamilyId) {
    const [
      membersRes,
      photosRes,
      journalRes,
      voiceRes,
      capsulesRes,
      storiesRes,
      eventsRes,
    ] = await Promise.all([
      supabase.from("family_members").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("home_mosaic_photos").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("voice_memos").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("time_capsules").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("family_stories").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId).eq("published", true),
      supabase.from("family_events").select("id, title, event_date, category").eq("family_id", activeFamilyId).gte("event_date", new Date().toISOString().slice(0, 10)).lte("event_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)).order("event_date", { ascending: true }).limit(10),
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
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        Welcome home
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Your family hub. Pick a destination below.
      </p>

      {activeFamilyId && (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 min-[900px]:grid-cols-3">
            <div className="min-[900px]:col-span-2">
              <DashboardStats stats={stats} />
            </div>
            <div>
              <UpcomingEvents events={upcomingEvents} />
            </div>
          </div>
          <div className="mt-6">
            <DashboardAchievements stats={stats} />
          </div>
        </>
      )}

      <div className="mt-12 grid grid-cols-1 gap-6 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3">
        <DashboardCard href="/dashboard/timeline" title="Timeline" description="All family memories in one chronological view. Journal, photos, voice memos, time capsules." icon="📅" />
        <DashboardCard href="/dashboard/events" title="Events" description="Birthdays, anniversaries, reunions. Create events and send celebratory messages." icon="🎂" />
        <DashboardCard href="/dashboard/stories" title="Stories" description="Longer-form family history, advice, and memorable moments. Write and share stories." icon="📖" />
        <DashboardCard href="/dashboard/map" title="Family Map" description="See where the family has been. Add your own pins." icon="🗺️" />
        <DashboardCard href="/dashboard/journal" title="Journal" description="Trips, birthdays, celebrations. Add photos. Others can add their perspective to any entry." icon="📔" />
        <DashboardCard href="/dashboard/photos" title="Photos" description="All uploaded photos can be found here and these are used to complete your background mosaics." icon="🖼️" />
        <DashboardCard href="/dashboard/achievements" title="Achievements" description="Log achievements and team photos." icon="🏆" />
        <DashboardCard href="/dashboard/voice-memos" title="Voice Memos" description="Record voices for the future—stories, songs, jokes. Preserve personality." icon="🎙️" />
        <DashboardCard href="/dashboard/time-capsules" title="Time Capsules" description="Write letters for the future. Seal them until a date like &quot;Read when you turn 18.&quot;" icon="📮" />
        <DashboardCard href="/dashboard/recipes" title="Recipes" description="The story behind the food — who taught it, what occasions, photos from dinners." icon="🍳" />
        <DashboardCard href="/dashboard/traditions" title="Traditions" description="Taco Tuesday chants, holiday rituals, inside jokes — the cultural DNA that gets lost." icon="🏠" />
        <DashboardCard href="/dashboard/family-tree" title="Family Tree" description="See how the family connects. Parents, children, and relationships." icon="🌳" />
        <DashboardCard href="/dashboard/relationships" title="Family Web" description="Visualize how everyone is connected. Relationships and links between members." icon="🕸️" />
        <DashboardCard href="/dashboard/favourites" title="Favourites" description="Books, movies, shows, games — the stuff we love." icon="⭐" />
        <DashboardCard href="/dashboard/members" title="Members" description="See everyone in your family. Add new members with name, relationship, and email." icon="👋" />
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
      className="group block min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 transition-all duration-200 hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)] hover:shadow-xl hover:shadow-black/25 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <span className="text-3xl" role="img" aria-hidden="true">{icon}</span>
      <h2 className="mt-4 font-display text-xl font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">
        {title}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
    </Link>
  );
}
