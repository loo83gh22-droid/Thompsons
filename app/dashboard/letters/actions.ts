"use server";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { revalidatePath } from "next/cache";

export async function createLetter(formData: FormData) {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { error: "No family selected" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: member } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", activeFamilyId)
    .eq("user_id", user.id)
    .single();
  if (!member) return { error: "Member not found" };

  const to_member_id = formData.get("to_member_id") as string;
  const title = (formData.get("title") as string)?.trim() || null;
  const body = (formData.get("body") as string)?.trim();
  const written_on = (formData.get("written_on") as string) || new Date().toISOString().slice(0, 10);
  const deliver_at_age_raw = formData.get("deliver_at_age") as string;
  const deliver_at_age = deliver_at_age_raw ? parseInt(deliver_at_age_raw) : null;

  if (!body) return { error: "Letter body is required" };

  const { data, error } = await supabase.from("family_letters").insert({
    family_id: activeFamilyId,
    from_member_id: member.id,
    to_member_id: to_member_id || null,
    title,
    body,
    written_on,
    deliver_at_age,
  }).select("id").single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/letters");
  return { success: true, id: data.id };
}

export async function updateLetter(letterId: string, formData: FormData) {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { error: "No family selected" };

  const title = (formData.get("title") as string)?.trim() || null;
  const body = (formData.get("body") as string)?.trim();
  const written_on = formData.get("written_on") as string;
  const deliver_at_age_raw = formData.get("deliver_at_age") as string;
  const deliver_at_age = deliver_at_age_raw ? parseInt(deliver_at_age_raw) : null;

  if (!body) return { error: "Letter body is required" };

  const { error } = await supabase.from("family_letters")
    .update({ title, body, written_on, deliver_at_age, updated_at: new Date().toISOString() })
    .eq("id", letterId)
    .eq("family_id", activeFamilyId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/letters");
  revalidatePath(`/dashboard/letters/${letterId}`);
  return { success: true };
}

export async function deleteLetter(letterId: string) {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { error: "No family selected" };

  const { error } = await supabase.from("family_letters")
    .delete()
    .eq("id", letterId)
    .eq("family_id", activeFamilyId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/letters");
  return { success: true };
}
