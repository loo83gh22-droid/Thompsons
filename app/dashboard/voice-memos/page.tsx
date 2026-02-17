import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddVoiceMemoForm } from "./AddVoiceMemoForm";
import { VoiceMemoList } from "./VoiceMemoList";

export default async function VoiceMemosPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [memosRes, membersRes, myMemberRes] = await Promise.all([
    supabase
      .from("voice_memos")
      .select(`
        id,
        title,
        description,
        audio_url,
        duration_seconds,
        recorded_date,
        created_at,
        family_member_id,
        recorded_for_id,
        transcript,
        transcription_status,
        transcribed_at,
        recorded_by:family_members!family_member_id(name, nickname, relationship),
        recorded_for:family_members!recorded_for_id(name, nickname, relationship)
      `)
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false }),
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
  ]);

  const memos = memosRes.data ?? [];
  const members = (membersRes.data ?? []) as { id: string; name: string; nickname: string | null; relationship: string | null }[];
  const myMemberId = myMemberRes.data?.id ?? null;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Voice Memos
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Record voices for the future—stories, songs, jokes. Imagine kids hearing their
            great-grandmother&apos;s voice decades from now.
          </p>
        </div>
        <AddVoiceMemoForm members={members} />
      </div>

      <VoiceMemoList memos={memos} currentUserMemberId={myMemberId} members={members} />
    </div>
  );
}
