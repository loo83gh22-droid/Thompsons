"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export type VoiceMemoInsert = {
  title: string;
  recordedById: string;
  recordedForId?: string | null;
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

  const { error } = await supabase.from("voice_memos").insert({
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
  });

  if (error) throw error;
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

/**
 * Creates a journal entry pre-filled with a voice memo's transcript.
 * Returns the new journal entry ID so the user can navigate to it.
 */
export async function sendTranscriptToJournal(voiceMemoId: string): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { success: false, error: "No active family" };

  const { data: memo } = await supabase
    .from("voice_memos")
    .select("title, transcript, family_member_id, recorded_date")
    .eq("id", voiceMemoId)
    .single();

  if (!memo?.transcript) return { success: false, error: "No transcript available." };

  const { data: inserted, error } = await supabase
    .from("journal_entries")
    .insert({
      family_id: activeFamilyId,
      family_member_id: memo.family_member_id,
      title: memo.title,
      content: memo.transcript,
      trip_date: memo.recorded_date ?? new Date().toISOString().split("T")[0],
      location_type: "visit",
    })
    .select("id")
    .single();

  if (error || !inserted) return { success: false, error: error?.message ?? "Failed to create journal entry." };

  revalidatePath("/dashboard/journal");
  return { success: true, id: inserted.id };
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
