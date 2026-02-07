import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddVoiceMemoForm } from "./AddVoiceMemoForm";
import { VoiceMemoList } from "./VoiceMemoList";

export default async function VoiceMemosPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: memos } = await supabase
    .from("voice_memos")
    .select("id, title, description, audio_url, family_members(name)")
    .eq("family_id", activeFamilyId)
    .order("sort_order");

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Voice Memos
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Record voices for the future—stories, songs, jokes. Imagine kids hearing their great-grandmother&apos;s voice decades from now.
          </p>
        </div>
        <AddVoiceMemoForm />
      </div>

      <VoiceMemoList memos={memos ?? []} />
    </div>
  );
}
