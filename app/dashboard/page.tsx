import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { UI_DISPLAY, QUERY_LIMITS } from "@/src/lib/constants";

export const metadata: Metadata = {
  title: "My Family Nest — Dashboard",
};
import { getActiveFamilyId } from "@/src/lib/family";
import { PersonalGreeting } from "./PersonalGreeting";
import { DashboardStats } from "./DashboardStats";
import { UpcomingEvents } from "./UpcomingEvents";
import { ActivityFeed, type ActivityItem } from "./ActivityFeed";
import { FamilySummaryStrip } from "./FamilySummaryStrip";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { QuickActions } from "./QuickActions";
import { FamilyHighlight, type HighlightItem } from "./FamilyHighlight";
import { InspirationTip } from "./InspirationTip";
import { BirthdayBanner, type BirthdayPerson } from "./BirthdayBanner";
import { WeeklyStreak } from "./WeeklyStreak";
import { OnThisDay, type OnThisDayItem } from "./OnThisDay";

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
  let highlight: HighlightItem | null = null;
  let upcomingBirthdays: BirthdayPerson[] = [];
  let weekActiveDays: string[] = [];
  let weekStreak = 0;
  let onThisDayItems: OnThisDayItem[] = [];
  let userFirstName: string | null = null;

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
      birthdayMembersRes,
      recentActivityDatesRes,
      allJournalForOTDRes,
    ] = await Promise.all([
      supabase.from("family_members").select("id, name, avatar_url").eq("family_id", activeFamilyId).order("name").limit(QUERY_LIMITS.memberListDisplay),
      supabase.from("family_members").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("home_mosaic_photos").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("voice_memos").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("time_capsules").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      supabase.from("family_stories").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId).eq("published", true),
      supabase.from("family_events").select("id, title, event_date, category").eq("family_id", activeFamilyId).gte("event_date", new Date().toISOString().slice(0, 10)).lte("event_date", new Date(Date.now() + UI_DISPLAY.upcomingEventWindowMs).toISOString().slice(0, 10)).order("event_date", { ascending: true }).limit(QUERY_LIMITS.dashboardPreview),
      supabase.from("home_mosaic_photos").select("id, url, created_at").eq("family_id", activeFamilyId).order("created_at", { ascending: false }).limit(QUERY_LIMITS.dashboardPreview),
      supabase.from("journal_entries").select("id, title, created_at, family_members!author_id(name, nickname, relationship)").eq("family_id", activeFamilyId).order("created_at", { ascending: false }).limit(QUERY_LIMITS.dashboardPreview),
      supabase.from("voice_memos").select("id, title, created_at, duration_seconds, family_members!family_member_id(name, nickname, relationship)").eq("family_id", activeFamilyId).order("created_at", { ascending: false }).limit(QUERY_LIMITS.dashboardPreview),
      supabase.from("family_messages").select("id, title, created_at, family_members!sender_id(name, nickname, relationship)").eq("family_id", activeFamilyId).order("created_at", { ascending: false }).limit(QUERY_LIMITS.dashboardPreview),
      // Birthday detection: fetch members with birth dates
      supabase.from("family_members").select("id, name, birth_date").eq("family_id", activeFamilyId).not("birth_date", "is", null),
      // Streak: get distinct activity dates for last 56 days (8 weeks) across all content types
      supabase.from("journal_entries").select("created_at").eq("family_id", activeFamilyId).gte("created_at", new Date(Date.now() - 56 * 86_400_000).toISOString()).order("created_at", { ascending: false }),
      // On This Day: journal entries created on today's month/day in prior years
      supabase.from("journal_entries").select("id, title, created_at, family_members!author_id(name, nickname)").eq("family_id", activeFamilyId).order("created_at", { ascending: false }).limit(200),
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
    activityHasMore = combined.length > QUERY_LIMITS.recentActivity;
    activityItems = combined.slice(0, QUERY_LIMITS.recentActivity);
    summaryMembers = membersListRes.data ?? [];

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
        return { id: m.id, name: m.name, turningAge, daysUntil };
      })
      .filter((b) => b.daysUntil <= BIRTHDAY_WINDOW_DAYS)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    // ── Weekly activity streak ──────────────────────────────────────────
    // Collect unique ISO dates (YYYY-MM-DD) with any activity in past 8 weeks
    const allActivityDates = new Set<string>();
    // Journal dates
    for (const row of (recentActivityDatesRes.data ?? []) as { created_at: string }[]) {
      allActivityDates.add(row.created_at.slice(0, 10));
    }
    // Also fold in activity feed items (photos, voice, messages already fetched)
    for (const item of activityItems) {
      allActivityDates.add(item.createdAt.slice(0, 10));
    }

    // Build current week's active days (Sun–Sat)
    const currentSunday = new Date(todayLocal);
    currentSunday.setDate(todayLocal.getDate() - todayLocal.getDay());
    weekActiveDays = Array.from(allActivityDates).filter((d) => {
      const date = new Date(d + "T12:00:00");
      const weekEnd = new Date(currentSunday);
      weekEnd.setDate(currentSunday.getDate() + 6);
      return date >= currentSunday && date <= weekEnd;
    });

    // Count consecutive weeks with at least one active day (going backwards from current week)
    weekStreak = 0;
    let checkWeekStart = new Date(currentSunday);
    for (let w = 0; w < 8; w++) {
      const weekStart = new Date(checkWeekStart);
      const weekEnd = new Date(checkWeekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const hasActivity = Array.from(allActivityDates).some((d) => {
        const date = new Date(d + "T12:00:00");
        return date >= weekStart && date <= weekEnd;
      });
      if (hasActivity) {
        weekStreak++;
        checkWeekStart.setDate(checkWeekStart.getDate() - 7);
      } else {
        break; // streak broken
      }
    }

    // ── On This Day ────────────────────────────────────────────────────
    // Find content created on the same month/day in previous years
    const todayMonth = todayLocal.getMonth(); // 0-indexed
    const todayDay = todayLocal.getDate();
    const todayYear = todayLocal.getFullYear();

    const otdJournal = ((allJournalForOTDRes.data ?? []) as { id: string; title: string; created_at: string; family_members: { name: string; nickname: string | null } | { name: string; nickname: string | null }[] | null }[])
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
          memberName: author ? (author.nickname?.trim() || author.name) : null,
          createdAt: j.created_at,
          href: `/dashboard/journal/${j.id}/edit`,
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

    // Get current user's member ID and name for filtering
    const { data: currentUser } = await supabase.auth.getUser();
    const { data: currentMemberData } = await supabase
      .from("family_members")
      .select("id, name, nickname")
      .eq("family_id", activeFamilyId)
      .eq("user_id", currentUser.user?.id)
      .single();

    const currentMemberId = currentMemberData?.id;
    const currentMemberName = currentMemberData ? (currentMemberData.nickname?.trim() || currentMemberData.name) : null;
    userFirstName = currentMemberName ? currentMemberName.split(" ")[0] : null;

    // Query journal entries where user has added perspective
    const { data: userPerspectives } = await supabase
      .from("journal_perspectives")
      .select("journal_entry_id")
      .eq("author_id", currentMemberId);
    const journalIdsWithUserPerspective = new Set(
      userPerspectives?.map((p) => p.journal_entry_id) || []
    );

    // Filter combined activity to user-relevant memories
    const userRelevantActivity = combined.filter((item) => {
      // Photos: include all (uploader not currently tracked in activity query)
      if (item.type === "photo") return true;

      // Journal: created by user OR user added perspective
      if (item.type === "journal") {
        return (
          item.memberName === currentMemberName ||
          journalIdsWithUserPerspective.has(item.id)
        );
      }

      // Voice memo: recorded by user
      if (item.type === "voice_memo") {
        return item.memberName === currentMemberName;
      }

      // Message: sent by user
      if (item.type === "message") {
        return item.memberName === currentMemberName;
      }

      return false;
    });

    // Build highlight candidates from filtered user-relevant activity (messages excluded)
    const highlightCandidates: HighlightItem[] = userRelevantActivity.filter((item) => item.type !== "message").map((item) => ({
      type: item.type,
      id: item.id,
      title: item.title ?? null,
      imageUrl: item.thumbnailUrl ?? null,
      createdAt: item.createdAt,
      href: item.href,
    }));

    // Pick one highlight based on day-seed (changes daily)
    if (highlightCandidates.length > 0) {
      const daySeed = Math.floor(Date.now() / 86_400_000);
      highlight = highlightCandidates[daySeed % highlightCandidates.length];
    }
  }

  return (
    <div className="min-w-0 w-full overflow-x-hidden">
      <PersonalGreeting firstName={userFirstName} />

      {activeFamilyId && (
        <>
          {/* Birthday banner — shown when any family member has a birthday within 7 days */}
          {upcomingBirthdays.length > 0 && (
            <div className="mt-6">
              <BirthdayBanner birthdays={upcomingBirthdays} />
            </div>
          )}

          <div className="mt-6">
            <OnboardingChecklist
              memberCount={stats.memberCount}
              photoCount={stats.photoCount}
              journalCount={stats.journalCount}
              storyCount={stats.storyCount}
              voiceMemoCount={stats.voiceMemoCount}
            />
          </div>

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
              <div className="border-l-[3px] border-[var(--accent)] pl-3">
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

      <div className="mt-12 space-y-8">
        <QuickActions />
        <div className="grid grid-cols-1 gap-6 min-[768px]:grid-cols-2">
          <FamilyHighlight item={highlight} />
          <InspirationTip />
          {onThisDayItems.length > 0 && (
            <div className="min-[768px]:col-span-2">
              <OnThisDay items={onThisDayItems} />
            </div>
          )}
          <div className="min-[768px]:col-span-2">
            <WeeklyStreak activeDays={weekActiveDays} weekStreak={weekStreak} />
          </div>
        </div>
      </div>
    </div>
  );
}
