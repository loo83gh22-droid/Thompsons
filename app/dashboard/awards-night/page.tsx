import type { Metadata } from "next";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AwardsNightClient } from "./AwardsNightClient";

export const metadata: Metadata = { title: "Family Awards Night | Family Nest" };

export default async function AwardsNightPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: { user } } = await supabase.auth.getUser();

  const currentYear = new Date().getFullYear();

  const [awardsRes, membersRes, myMemberRes] = await Promise.all([
    supabase
      .from("family_awards")
      .select("id, award_name, recipient_id, year, description, is_roast, given_by, family_members!recipient_id(id, name, nickname, color)")
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("family_members")
      .select("id, name, nickname, color")
      .eq("family_id", activeFamilyId)
      .eq("is_remembered", false)
      .order("name"),
    user
      ? supabase.from("family_members").select("id, role").eq("user_id", user.id).eq("family_id", activeFamilyId).single()
      : Promise.resolve({ data: null }),
  ]);

  type MemberJoin = { id: string; name: string; nickname: string | null; color: string | null } | { id: string; name: string; nickname: string | null; color: string | null }[] | null;
  type RawAward = { id: string; award_name: string; recipient_id: string | null; year: number; description: string | null; is_roast: boolean; given_by: string | null; family_members: MemberJoin };

  const rawAwards = (awardsRes.data ?? []) as unknown as RawAward[];
  const awards = rawAwards.map(a => {
    const r = Array.isArray(a.family_members) ? a.family_members[0] : a.family_members;
    return {
      id: a.id,
      award_name: a.award_name,
      recipient_id: a.recipient_id,
      year: a.year,
      description: a.description,
      is_roast: a.is_roast,
      given_by: a.given_by,
      recipient: r ?? null,
    };
  });

  const members = membersRes.data ?? [];

  // Days since last award (for annual nudge)
  const lastAwardDate = awards.length > 0
    ? new Date(rawAwards.slice(-1)[0]?.year?.toString() ?? currentYear.toString())
    : null;
  const daysSinceLastAward = lastAwardDate
    ? Math.floor((Date.now() - lastAwardDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-2">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Family Awards Night 🏆</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Celebrate, roast, and honour the people who make your family unforgettable.
        </p>
      </div>
      <AwardsNightClient
        awards={awards}
        members={members}
        myMemberId={myMemberRes.data?.id ?? null}
        myRole={myMemberRes.data?.role ?? "teen"}
        currentYear={currentYear}
        daysSinceLastAward={daysSinceLastAward}
      />
    </div>
  );
}
