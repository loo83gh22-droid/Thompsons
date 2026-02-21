"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export type VoiceMemoInsert = {
  title: string;
  recordedById: string;
  recordedForId?: string | null;
  memberIds?: string[];
  recordedDate: string;
  description?: string | null;
  audioUrl: string;
  durationSeconds: number;
};

export async function insertVoiceMemo(data: VoiceMemoInsert) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { data: last } = await supabase
    .from("voice_memos")
    .select("sort_order")
    .eq("family_id", activeFamilyId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;

  const { data: row, error } = await supabase.from("voice_memos").insert({
    family_id: activeFamilyId,
    family_member_id: data.recordedById,
    recorded_for_id: data.recordedForId ?? null,
    title: data.title.trim().slice(0, 100),
    description: data.description?.trim().slice(0, 500) || null,
    audio_url: data.audioUrl,
    duration_seconds: data.durationSeconds,
    recorded_date: data.recordedDate,
    sort_order: nextOrder,
    updated_at: new Date().toISOString(),
  }).select("id").single();

  if (error) throw error;

  // Insert junction table rows for all selected members
  const ids = data.memberIds?.filter(Boolean) ?? [];
  if (row?.id && ids.length > 0) {
    await supabase.from("voice_memo_members").insert(
      ids.map((memberId) => ({ voice_memo_id: row.id, family_member_id: memberId }))
    );
  }

  revalidatePath("/dashboard/voice-memos");
}

export type VoiceMemoUpdate = {
  title: string;
  recordedById: string;
  recordedForId?: string | null;
  recordedDate: string;
  description?: string | null;
};

export async function updateVoiceMemo(id: string, data: VoiceMemoUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("voice_memos")
    .update({
      family_member_id: data.recordedById,
      recorded_for_id: data.recordedForId ?? null,
      title: data.title.trim().slice(0, 100),
      description: data.description?.trim().slice(0, 500) || null,
      recorded_date: data.recordedDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/voice-memos");
}

function pathFromAudioUrl(audioUrl: string): string | null {
  try {
    const u = new URL(audioUrl);
    const match = u.pathname.match(/\/storage\/v1\/object\/public\/voice-memos\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function removeVoiceMemo(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: row } = await supabase
    .from("voice_memos")
    .select("audio_url")
    .eq("id", id)
    .single();

  if (row?.audio_url) {
    const path = pathFromAudioUrl(row.audio_url);
    if (path) {
      await supabase.storage.from("voice-memos").remove([path]);
    }
  }

  const { error } = await supabase.from("voice_memos").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/voice-memos");
}
