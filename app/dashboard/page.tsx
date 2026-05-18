import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { QUERY_LIMITS } from "@/src/lib/constants";

export const metadata: Metadata = {
  title: "My Family Nest | Dashboard",
};
import { getActiveFamilyId } from "@/src/lib/family";
import { PersonalGreeting } from "./PersonalGreeting";
import { DashboardStats } from "./DashboardStats";
import { UpcomingEvents } from "./UpcomingEvents";
import { ActivityFeed, type ActivityItem } from "./ActivityFeed";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { SerendipityCard, type HighlightItem, type OnThisDayItem } from "./SerendipityCard";
import { BirthdayBanner, type BirthdayPerson } from "./BirthdayBanner";
import { GiftWelcomeBanner } from "./GiftWelcomeBanner";
import { StarterProgress } from "./StarterProgress";
import { FirstWinPrompt } from "./FirstWinPrompt";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const params = await searchParams;
  const showGiftWelcome = params.welcome === "gift";
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const todayDate = new Date();
  const nowMs = todayDate.getTime();

  let stats = {
    memberCount: 0,
    journalCount: 0,
    voiceMemoCount: 0,
    photoCount: 0,
    timeCapsuleCount: 0,
    storyCount: 0,
    lastActivityBy: null as string | null,
    lastActivityAt: null as string | null,
  };
  let upcomingEvents: { id: string; title: string; event_date: string; category: string }[] = [];
  let activityItems: ActivityItem[] = [];
  let activityHasMore = false;
  let highlight: HighlightItem | null = null;
  let upcomingBirthdays: BirthdayPerson[] = [];
  let onThisDayItems: OnThisDayItem[] = [];
  let userFirstName: string | null = null;
  let gratitudeOfTheDay: { content: string; member_name: string } | null = null;

  if (activeFamilyId) {
    const [
      membersRes,
      journalRes,
      voiceRes,
      photosRes,
      capsulesRes,
      storiesRes,
      eventsRes,
      journalActivity,
      voiceActivity,
      storiesActivity,
      birthdayMembersRes,
      allJournalForOTDRes,
    ] = await Promise.all([
      supabase.from("family_members").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("voice_memos").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("home_mosaic_photos").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("time_capsules").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("family_stories").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId).eq("published", true),
      supabase.from("family_events").select("id, title, event_date, category").eq("family_id", activeFamilyId).gte("event_date", todayDate.toISOString().slice(0, 10)).order("event_date", { ascending: true }).limit(3),
      supabase.from("journal_entries").select("id, title, trip_date, created_at, family_members!author_id(id, name, relationship), journal_photos!entry_id(url, sort_order)").eq("family_id", activeFamilyId).order("created_at", { ascending: false }).limit(QUERY_LIMITS.dashboardPreview),
      supabase.from("voice_memos").select("id, title, created_at, duration_seconds, family_members!family_member_id(id, name, relationship)").eq("family_id", activeFamilyId).order("created_at", { ascending: false }).limit(QUERY_LIMITS.dashboardPreview),
      supabase.from("family_stories").select("id, title, cover_url, created_at, family_members!author_family_member_id(id, name, relationship)").eq("family_id", activeFamilyId).eq("published", true).order("created_at", { ascending: false }).limit(QUERY_LIMITS.dashboardPreview),
      // Birthday detection: fetch members with birth dates
      supabase.from("family_members").select("id, name, birth_date").eq("family_id", activeFamilyId).not("birth_date", "is", null),
      // On This Day: journal entries created on today's month/day in prior years
      supabase.from("journal_entries").select("id, title, created_at, family_members!author_id(id, name)").eq("family_id", activeFamilyId).order("created_at", { ascending: false }).limit(200),
    ]);

    // Fetch current viewer's member record and personal aliases
    const { data: currentMemberData } = currentUser
      ? await supabase.from("family_members").select("id, name, nickname").eq("family_id", activeFamilyId).eq("user_id", currentUser.id).single()
      : { data: null };
    const currentMemberId = currentMemberData?.id ?? null;

    const { data: aliasRows } = currentMemberId
      ? await supabase.from("member_aliases").select("target_member_id, label").eq("viewer_member_id", currentMemberId)
      : { data: [] };
    const aliasMap: Record<string, string> = Object.fromEntries(
      (aliasRows ?? []).map((a: { target_member_id: string; label: string }) => [a.target_member_id, a.label])
    );

    // Helper: resolve how the current viewer sees a member
    const resolveName = (memberId: string | null, memberName: string | null): string | null => {
      if (!memberId || !memberName) return memberName;
      if (aliasMap[memberId]) return aliasMap[memberId];
      return memberName.split(" ")[0]; // default to first name
    };

    stats = {
      memberCount: membersRes.count ?? 0,
      journalCount: journalRes.count ?? 0,
      voiceMemoCount: voiceRes.count ?? 0,
      photoCount: photosRes.count ?? 0,
      timeCapsuleCount: capsulesRes.count ?? 0,
      storyCount: storiesRes.count ?? 0,
      lastActivityBy: null,
      lastActivityAt: null,
    };
    upcomingEvents = eventsRes.data ?? [];

    const one = <T,>(x: T | T[] | null): T | null => (x == null ? null : Array.isArray(x) ? x[0] ?? null : x);

    type MemberJoin = { id: string; name: string; relationship: string | null } | { id: string; name: string; relationship: string | null }[] | null;

    const journalRows = (journalActivity.data ?? []).map((j: { id: string; title: string; trip_date?: string | null; created_at: string; family_members: MemberJoin; journal_photos?: { url: string; sort_order: number | null }[] | null }) => {
      const author = one(j.family_members);
      const photos = Array.isArray(j.journal_photos) ? j.journal_photos : (j.journal_photos ? [j.journal_photos] : []);
      const firstPhoto = photos.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
      return {
        type: "journal" as const,
        id: j.id,
        memberId: author?.id ?? null,
        createdAt: j.created_at,
        tripDate: j.trip_date ?? null,
        title: j.title,
        thumbnailUrl: firstPhoto?.url ?? null,
        memberName: resolveName(author?.id ?? null, author?.name ?? null),
        memberRelationship: author?.relationship ?? null,
        durationSeconds: null,
        href: `/dashboard/journal/${j.id}`,
      };
    });

    const voiceRows = (voiceActivity.data ?? []).map((v: { id: string; title: string; created_at: string; duration_seconds: number | null; family_members: MemberJoin }) => {
      const by = one(v.family_members);
      return {
        type: "voice_memo" as const,
        id: v.id,
        memberId: by?.id ?? null,
        createdAt: v.created_at,
        title: v.title,
        thumbnailUrl: null,
        memberName: resolveName(by?.id ?? null, by?.name ?? null),
        memberRelationship: by?.relationship ?? null,
        durationSeconds: v.duration_seconds ?? null,
        href: "/dashboard/voice-memos",
      };
    });

    const storyRows = (storiesActivity.data ?? []).map((s: { id: string; title: string; cover_url?: string | null; created_at: string; family_members: MemberJoin }) => {
      const author = one(s.family_members);
      return {
        type: "story" as const,
        id: s.id,
        memberId: author?.id ?? null,
        createdAt: s.created_at,
        title: s.title,
        thumbnailUrl: s.cover_url ?? null,
        memberName: resolveName(author?.id ?? null, author?.name ?? null),
        memberRelationship: author?.relationship ?? null,
        durationSeconds: null,
        href: `/dashboard/stories/${s.id}`,
      };
    });

    const combined = [...journalRows, ...voiceRows, ...storyRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    activityHasMore = combined.length > QUERY_LIMITS.recentActivity;
    activityItems = combined.slice(0, QUERY_LIMITS.recentActivity);

    const first = activityItems[0];
    if (first) {
      stats.lastActivityAt = first.createdAt;
      stats.lastActivityBy = first.memberName ?? null;
    }

    // ── Birthday detection ──────────────────────────────────────────────
    const todayLocal = new Date();
    todayLocal.setHours(0, 0, 0, 0);
    const BIRTHDAY_WINDOW_DAYS = 7;

    upcomingBirthdays = ((birthdayMembersRes.data ?? []) as { id: string; name: string; birth_date: string }[])
      .map((m) => {
        const bd = new Date(m.birth_date + "T12:00:00"); // noon to avoid tz shift
        // This year's birthday
        const thisYearBirthday = new Date(todayLocal.getFullYear(), bd.getMonth(), bd.getDate());
        // If already passed this year, check next year
        const nextBirthday = thisYearBirthday < todayLocal
          ? new Date(todayLocal.getFullYear() + 1, bd.getMonth(), bd.getDate())
          : thisYearBirthday;
        const daysUntil = Math.round((nextBirthday.getTime() - todayLocal.getTime()) / 86_400_000);
        const birthYear = bd.getFullYear();
        const turningAge = birthYear > 1900
          ? nextBirthday.getFullYear() - birthYear
          : null;
        return { id: m.id, name: resolveName(m.id, m.name) ?? m.name, turningAge, daysUntil };
      })
      .filter((b) => b.daysUntil <= BIRTHDAY_WINDOW_DAYS)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    // ── On This Day ────────────────────────────────────────────────────
    // Find content created on the same month/day in previous years
    const todayMonth = todayLocal.getMonth(); // 0-indexed
    const todayDay = todayLocal.getDate();
    const todayYear = todayLocal.getFullYear();

    const otdJournal = ((allJournalForOTDRes.data ?? []) as { id: string; title: string; created_at: string; family_members: { id: string; name: string } | { id: string; name: string }[] | null }[])
      .filter((j) => {
        const d = new Date(j.created_at);
        return d.getMonth() === todayMonth && d.getDate() === todayDay && d.getFullYear() < todayYear;
      })
      .map((j): OnThisDayItem => {
        const raw = j.family_members;
        const author = Array.isArray(raw) ? raw[0] : raw;
        const yearsAgo = todayYear - new Date(j.created_at).getFullYear();
        return {
          type: "journal",
          id: j.id,
          title: j.title,
          memberName: resolveName(author?.id ?? null, author?.name ?? null),
          createdAt: j.created_at,
          href: `/dashboard/journal/${j.id}`,
          yearsAgo,
        };
      });

    // Cap at 4 items total — pick most recent per unique year
    const seenYears = new Set<number>();
    onThisDayItems = otdJournal
      .sort((a, b) => a.yearsAgo - b.yearsAgo)
      .filter((item) => {
        if (seenYears.has(item.yearsAgo)) return false;
        seenYears.add(item.yearsAgo);
        return true;
      })
      .slice(0, 4);

    // Set greeting first name — always use first word of name (nickname is a label set by others)
    userFirstName = currentMemberData?.name?.split(" ")[0] ?? null;

    // Query journal entries where user has added perspective
    // (column on journal_perspectives is family_member_id, not author_id)
    const { data: userPerspectives } = currentMemberId
      ? await supabase
          .from("journal_perspectives")
          .select("journal_entry_id")
          .eq("family_member_id", currentMemberId)
      : { data: null };
    const journalIdsWithUserPerspective = new Set(
      userPerspectives?.map((p: { journal_entry_id: string }) => p.journal_entry_id) || []
    );

    // Filter combined activity to user-relevant memories (compare by member ID)
    const userRelevantActivity = combined.filter((item) => {
      // Journal: created by user OR user added perspective
      if (item.type === "journal") {
        return (
          item.memberId === currentMemberId ||
          journalIdsWithUserPerspective.has(item.id)
        );
      }

      // Voice memo: recorded by user
      if (item.type === "voice_memo") {
        return item.memberId === currentMemberId;
      }

      // Story: authored by user
      if (item.type === "story") {
        return item.memberId === currentMemberId;
      }

      return false;
    });

    const highlightCandidates: HighlightItem[] = userRelevantActivity.map((item) => ({
      type: item.type,
      id: item.id,
      title: item.title ?? null,
      imageUrl: item.thumbnailUrl ?? null,
      createdAt: item.createdAt,
      eventDate: item.type === "journal" ? (item.tripDate ?? null) : null,
      href: item.href,
    }));

    // Pick one highlight based on day-seed (changes daily)
    if (highlightCandidates.length > 0) {
      const daySeed = Math.floor(nowMs / 86_400_000);
      highlight = highlightCandidates[daySeed % highlightCandidates.length];
    }

    // Gratitude of the Day — pick one post per day, rotates daily
    const { data: gratitudePosts } = await supabase
      .from("gratitude_posts")
      .select("content, family_members!member_id(name, nickname)")
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (gratitudePosts && gratitudePosts.length > 0) {
      const daySeed = Math.floor(nowMs / 86_400_000);
      const pick = gratitudePosts[daySeed % gratitudePosts.length] as { content: string; family_members: { name: string; nickname: string | null } | { name: string; nickname: string | null }[] | null };
      const m = Array.isArray(pick.family_members) ? pick.family_members[0] : pick.family_members;
      gratitudeOfTheDay = { content: pick.content, member_name: m?.nickname ?? m?.name ?? "Family" };
    }
  }

  // Activation state ─────────────────────────────────────────────────
  // hasAnyEntry  → user has posted at least one piece of content.
  //                Triggers the FirstWinPrompt (one-shot invite nudge).
  // isStillEmpty → brand-new family with zero content and only the
  //                owner as a member. Strip the dashboard down to the
  //                onboarding nudge so they don't see a wall of empty
  //                cards on day 1. The moment they post anything (or
  //                invite someone), the full dashboard appears.
  const hasAnyEntry =
    stats.journalCount + stats.voiceMemoCount + stats.photoCount + stats.storyCount > 0;
  const isStillEmpty = !hasAnyEntry && stats.memberCount <= 1;

  return (
    <div className="min-w-0 w-full overflow-x-hidden">
      <PersonalGreeting firstName={userFirstName} />

      {showGiftWelcome && (
        <div className="mt-6">
          <GiftWelcomeBanner />
        </div>
      )}

      {activeFamilyId && (
        <>
          {/* Birthday banner — shown when any family member has a birthday within 7 days */}
          {upcomingBirthdays.length > 0 && (
            <div className="mt-6">
              <BirthdayBanner birthdays={upcomingBirthdays} />
            </div>
          )}

          <div className="mt-6">
            <StarterProgress
              journalCount={stats.journalCount}
              photoCount={stats.photoCount}
              voiceMemoCount={stats.voiceMemoCount}
              memberCount={stats.memberCount}
            />
          </div>

          <div className="mt-4">
            <OnboardingChecklist
              memberCount={stats.memberCount}
              journalCount={stats.journalCount}
              storyCount={stats.storyCount}
              photoCount={stats.photoCount}
            />
          </div>

          {/* First-win celebration: fires once after the user posts their
              first entry but hasn't invited anyone yet. */}
          <FirstWinPrompt
            hasFirstEntry={hasAnyEntry}
            memberCount={stats.memberCount}
            ownerFirstName={userFirstName}
          />

          <section className="mt-8" aria-labelledby="activity-heading">
            <div className="flex flex-col gap-2 min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between">
              <div className="border-l-[3px] border-[var(--accent)] pl-3">
                <h2 id="activity-heading" className="font-display text-xl font-semibold text-[var(--foreground)]">
                  In the Nest
                </h2>
                <p className="mt-0.5 text-sm text-[var(--muted)]">
                  What&apos;s been added to your family&apos;s story
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

          {/* Below-the-fold widgets — hidden on a brand-new empty Nest so
              the day-1 dashboard stays focused on the starter nudge.
              The moment the user posts anything or invites a member,
              these reappear. */}
          {!isStillEmpty && (
            <>
              <div className="mt-10">
                <SerendipityCard
                  highlight={highlight}
                  onThisDayItems={onThisDayItems}
                  gratitudeOfTheDay={gratitudeOfTheDay}
                  daySeed={Math.floor(nowMs / 86_400_000)}
                />
              </div>

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

        </>
      )}
    </div>
  );
}
