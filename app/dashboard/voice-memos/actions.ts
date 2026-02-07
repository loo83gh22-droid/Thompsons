"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export async function addVoiceMemo(
  file: File,
  data: { familyMemberId?: string; title: string; description?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
  const allowed = ["mp3", "m4a", "wav", "ogg", "webm"];
  if (!allowed.includes(ext)) {
    throw new Error("Use MP3, M4A, WAV, OGG, or WebM.");
  }
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("voice-memos")
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("voice-memos")
    .getPublicUrl(path);

  const { data: last } = await supabase
    .from("voice_memos")
    .select("sort_order")
    .eq("family_id", activeFamilyId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;

  const { error: insertError } = await supabase.from("voice_memos").insert({
    family_id: activeFamilyId,
    family_member_id: data.familyMemberId || null,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    audio_url: urlData.publicUrl,
    sort_order: nextOrder,
  });

  if (insertError) throw insertError;
  revalidatePath("/dashboard/voice-memos");
}

export async function removeVoiceMemo(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("voice_memos").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/voice-memos");
}
