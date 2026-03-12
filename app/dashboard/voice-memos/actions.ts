"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { getFamilyPlan, checkFeatureLimit, enforceStorageLimit, addStorageUsage, subtractStorageUsage } from "@/src/lib/plans";

export type VoiceMemoInsert = {
  title: string;
  recordedById: string;
  recordedForId?: string | null;
  memberIds?: string[];
  recordedDate: string;
  description?: string | null;
  audioUrl: string;
  durationSeconds: number;
  /** File size in bytes — used for storage tracking. Pass 0 if unknown. */
  fileSizeBytes?: number;
  /** Client-generated UUID to prevent duplicate inserts on network retry. */
  idempotencyKey?: string | null;
  photoUrl?: string | null;
};

export async function insertVoiceMemo(data: VoiceMemoInsert) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Enforce voice memo limit
  const plan = await getFamilyPlan(supabase, activeFamilyId);
  const limitError = await checkFeatureLimit(supabase, activeFamilyId, plan.planType, "voiceMemos", "voice_memos");
  if (limitError) throw new Error(limitError);

  const { data: last } = await supabase
    .from("voice_memos")
    .select("sort_order")
    .eq("family_id", activeFamilyId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;

  // Enforce storage limit before registering the (already-uploaded) audio (G4)
  const fileBytes = data.fileSizeBytes ?? 0;
  if (fileBytes > 0) {
    await enforceStorageLimit(supabase, activeFamilyId, fileBytes);
  }

  const { data: row, error } = await supabase.from("voice_memos").insert({
    family_id: activeFamilyId,
    family_member_id: data.recordedById,
    recorded_for_id: data.recordedForId ?? null,
    title: data.title.trim().slice(0, 100),
    description: data.description?.trim().slice(0, 500) || null,
    audio_url: data.audioUrl,
    photo_url: data.photoUrl ?? null,
    duration_seconds: data.durationSeconds,
    file_size_bytes: fileBytes,
    recorded_date: data.recordedDate,
    sort_order: nextOrder,
    updated_at: new Date().toISOString(),
    idempotency_key: data.idempotencyKey ?? null,
  }).select("id").single();

  if (error) {
    // Duplicate submission — idempotency key already used. Treat as success.
    if (error.code === "23505" && data.idempotencyKey) return;
    throw error;
  }

  if (fileBytes > 0) {
    await addStorageUsage(supabase, activeFamilyId, fileBytes);
  }

  // Insert junction table rows for all selected members
  const ids = data.memberIds?.filter(Boolean) ?? [];
  if (row?.id && ids.length > 0) {
    const { error: junctionErr } = await supabase.from("voice_memo_members").insert(
      ids.map((memberId) => ({ voice_memo_id: row.id, family_member_id: memberId }))
    );
    if (junctionErr) console.error("[insertVoiceMemo] voice_memo_members insert failed:", junctionErr.message);
  }

  revalidatePath("/dashboard/voice-memos");
}

export type VoiceMemoUpdate = {
  title: string;
  recordedById: string;
  recordedForId?: string | null;
  recordedDate: string;
  description?: string | null;
  photoUrl?: string | null;
};

export async function updateVoiceMemo(id: string, data: VoiceMemoUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Resolve current member — used to enforce creator-or-privileged-role check.
  const { data: currentMember } = await supabase
    .from("family_members")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();
  if (!currentMember) throw new Error("Member not found");

  const isPrivileged = ["owner", "adult"].includes(currentMember.role);

  // Build the update query. owner/adult can edit any memo in the family;
  // teen/child can only edit memos they recorded themselves.
  const query = supabase
    .from("voice_memos")
    .update({
      family_member_id: data.recordedById,
      recorded_for_id: data.recordedForId ?? null,
      title: data.title.trim().slice(0, 100),
      description: data.description?.trim().slice(0, 500) || null,
      recorded_date: data.recordedDate,
      ...("photoUrl" in data ? { photo_url: data.photoUrl ?? null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("family_id", activeFamilyId);

  const { error } = isPrivileged
    ? await query
    : await query.eq("family_member_id", currentMember.id);

  if (error) throw error;
  revalidatePath("/dashboard/voice-memos");
}

function pathFromVoiceMemoUrl(url: string): string | null {
  if (!url) return null;
  // Proxied format: /api/storage/voice-memos/{path}
  const proxied = url.match(/^\/api\/storage\/voice-memos\/(.+)$/);
  if (proxied) return proxied[1];
  // Full Supabase storage URL
  try {
    const u = new URL(url);
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
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Resolve current member for creator-or-privileged-role check.
  const { data: currentMember } = await supabase
    .from("family_members")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();
  if (!currentMember) throw new Error("Member not found");

  const isPrivileged = ["owner", "adult"].includes(currentMember.role);

  // Fetch the memo — restrict to creator for teen/child, any for owner/adult.
  const memoQuery = supabase
    .from("voice_memos")
    .select("audio_url, photo_url, file_size_bytes")
    .eq("id", id)
    .eq("family_id", activeFamilyId);

  const { data: row } = isPrivileged
    ? await memoQuery.single()
    : await memoQuery.eq("family_member_id", currentMember.id).single();

  // If the row wasn't found (non-privileged user trying to delete someone
  // else's memo) bail out silently — nothing to clean up.
  if (!row) return;

  const pathsToDelete: string[] = [];
  if (row?.audio_url) {
    const path = pathFromVoiceMemoUrl(row.audio_url);
    if (path) pathsToDelete.push(path);
  }
  if (row?.photo_url) {
    const path = pathFromVoiceMemoUrl(row.photo_url);
    if (path) pathsToDelete.push(path);
  }
  if (pathsToDelete.length > 0) {
    const { error: storageErr } = await supabase.storage.from("voice-memos").remove(pathsToDelete);
    if (storageErr) {
      console.error("[removeVoiceMemo] storage removal failed:", storageErr.message);
      // Continue with DB deletion — counter will still be decremented
    }
  }

  const { error } = await supabase.from("voice_memos").delete().eq("id", id).eq("family_id", activeFamilyId);
  if (error) throw error;

  // Decrement storage counter (B5)
  if (row?.file_size_bytes && row.file_size_bytes > 0) {
    await subtractStorageUsage(supabase, activeFamilyId, row.file_size_bytes);
  }

  revalidatePath("/dashboard/voice-memos");
}
