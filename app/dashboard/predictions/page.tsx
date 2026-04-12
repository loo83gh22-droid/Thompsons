import type { Metadata } from "next";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { PredictionsClient } from "./PredictionsClient";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata: Metadata = { title: "Family Predictions | Family Nest" };

export default async function PredictionsPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const { data: { user } } = await supabase.auth.getUser();

  const [predsRes, membersRes, myMemberRes] = await Promise.all([
    supabase
      .from("family_predictions")
      .select("id, topic, target_date, outcome, resolved_at, created_at")
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

  const predictions = predsRes.data ?? [];
  const members = membersRes.data ?? [];
  const predIds = predictions.map(p => p.id);

  const entriesRes = predIds.length > 0
    ? await supabase
        .from("family_prediction_entries")
        .select("id, prediction_id, member_id, prediction, is_correct, family_members!member_id(id, name, nickname, color)")
        .in("prediction_id", predIds)
        .order("created_at")
    : { data: [] };

  type MemberJoin = { id: string; name: string; nickname: string | null; color: string | null } | { id: string; name: string; nickname: string | null; color: string | null }[] | null;
  type RawEntry = { id: string; prediction_id: string; member_id: string | null; prediction: string; is_correct: boolean | null; family_members: MemberJoin };

  const entriesByPred = new Map<string, { id: string; member_id: string | null; prediction: string; is_correct: boolean | null; member: { id: string; name: string; nickname: string | null; color: string | null } | null }[]>();
  for (const e of (entriesRes.data ?? []) as unknown as RawEntry[]) {
    const m = Array.isArray(e.family_members) ? e.family_members[0] : e.family_members;
    if (!entriesByPred.has(e.prediction_id)) entriesByPred.set(e.prediction_id, []);
    entriesByPred.get(e.prediction_id)!.push({
      id: e.id,
      member_id: e.member_id,
      prediction: e.prediction,
      is_correct: e.is_correct,
      member: m ?? null,
    });
  }

  const hydratedPredictions = predictions.map(p => ({
    ...p,
    entries: entriesByPred.get(p.id) ?? [],
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-2">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Family Predictions</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Pose a question, everyone adds their prediction, then reveal the answer when the time comes.
        </p>
      </div>
      <PredictionsClient
        predictions={hydratedPredictions}
        members={members}
        myMemberId={myMemberRes.data?.id ?? null}
        myRole={myMemberRes.data?.role ?? "teen"}
      />
    </div>
  );
}
