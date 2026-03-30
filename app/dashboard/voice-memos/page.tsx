import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddVoiceMemoForm } from "./AddVoiceMemoForm";
import { VoiceMemoList } from "./VoiceMemoList";
import { PlanLimitBadge } from "@/app/dashboard/components/PlanLimitBadge";
import { PLAN_LIMITS } from "@/src/lib/constants";

export const metadata = { title: "Voice Memos | Family Nest" };

export default async function VoiceMemosPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: familyPlan } = await supabase
    .from("families")
    .select("plan_type")
    .eq("id", activeFamilyId)
    .single();
  const planType = (familyPlan?.plan_type as "free" | "annual" | "legacy") ?? "free";

  const [memosRes, membersRes, myMemberRes, contactsRes] = await Promise.all([
    supabase
      .from("voice_memos")
      .select(`
        id,
        title,
        description,
        audio_url,
        photo_url,
        duration_seconds,
        recorded_date,
        created_at,
        family_member_id,
        recorded_for_id,
        transcript,
        transcription_status,
        transcribed_at,
        is_public,
        share_token,
        recorded_by:family_members!family_member_id(name, nickname, relationship),
        recorded_for:family_members!recorded_for_id(name, nickname, relationship)
      `)
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("family_members")
      .select("id, name, nickname, relationship")
      .eq("family_id", activeFamilyId)
      .order("name"),
    user
      ? supabase
          .from("family_members")
          .select("id")
          .eq("family_id", activeFamilyId)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("family_contacts")
      .select("id, name, email, relationship")
      .eq("family_id", activeFamilyId)
      .order("name"),
  ]);

  const memos = memosRes.data ?? [];
  const members = (membersRes.data ?? []) as { id: string; name: string; nickname: string | null; relationship: string | null }[];
  const myMemberId = myMemberRes.data?.id ?? null;
  const contacts = (contactsRes.data ?? []) as { id: string; name: string; email: string | null; relationship: string | null }[];

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Voice Memos
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Record mom singing the bedtime song. Capture what the kids sound like right now. Save the jokes, the accents, the things words alone can&apos;t hold.
          </p>
          {planType === "free" && (
            <div className="mt-2">
              <PlanLimitBadge used={memos.length} limit={PLAN_LIMITS.free.voiceMemos} label="voice memos" />
            </div>
          )}
        </div>
        <div className="shrink-0">
          <AddVoiceMemoForm members={members} />
        </div>
      </div>

      <VoiceMemoList memos={memos} currentUserMemberId={myMemberId} members={members} contacts={contacts} />
    </div>
  );
}
