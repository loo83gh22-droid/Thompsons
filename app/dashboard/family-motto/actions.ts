"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export async function saveMotto(motto: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { data: member } = await supabase
      .from("family_members").select("id").eq("family_id", activeFamilyId).eq("user_id", user.id).single();

    const { error } = await supabase.from("family_motto").upsert(
      { family_id: activeFamilyId, motto: motto.trim(), updated_by: member?.id ?? null, updated_at: new Date().toISOString() },
      { onConflict: "family_id" }
    );
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/family-motto");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function addValue(value: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { data: member } = await supabase
      .from("family_members").select("id").eq("family_id", activeFamilyId).eq("user_id", user.id).single();

    const { error } = await supabase.from("family_values").insert({
      family_id: activeFamilyId,
      value: value.trim(),
      added_by_member_id: member?.id ?? null,
    });
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/family-motto");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function deleteValue(valueId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase.from("family_values").delete()
      .eq("id", valueId).eq("family_id", activeFamilyId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/family-motto");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function savePersonalNote(note: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    // Derive memberId server-side — a user may only write their own personal note
    const { data: member } = await supabase
      .from("family_members").select("id").eq("family_id", activeFamilyId).eq("user_id", user.id).single();
    if (!member) return { success: false, error: "Member not found." };
    const memberId = member.id;

    const { error } = await supabase.from("member_motto_notes").upsert(
      { family_id: activeFamilyId, family_member_id: memberId, personal_note: note.trim(), updated_at: new Date().toISOString() },
      { onConflict: "family_member_id" }
    );
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/family-motto");
    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}
