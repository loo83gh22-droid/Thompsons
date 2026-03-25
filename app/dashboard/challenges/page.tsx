import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { ChallengeBoard } from "./ChallengeBoard";

export const metadata = { title: "Family Challenges | Family Nest" };

export default async function ChallengesPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const today = new Date().toISOString().split("T")[0];

  const [{ data: members }, { data: challenges }] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, name, nickname")
      .eq("family_id", activeFamilyId)
      .eq("is_remembered", false)
      .order("name"),
    supabase
      .from("family_challenges")
      .select(`
        id, title, description, emoji, challenge_type,
        duration_days, end_date, status, created_at,
        challenge_completions(family_member_id),
        challenge_checkins(family_member_id, checkin_date)
      `)
      .eq("family_id", activeFamilyId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          🎯 Family Challenges
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Set goals, track progress, do it together. Check in daily or mark it done.
        </p>
      </div>

      <ChallengeBoard rawChallenges={challenges ?? []} members={members ?? []} />
    </div>
  );
}
