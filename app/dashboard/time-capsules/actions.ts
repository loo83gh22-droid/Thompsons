"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export async function createTimeCapsule(
  toFamilyMemberId: string,
  title: string,
  content: string,
  unlockDate: string,
  memberIds?: string[],
  unlockOnPassing?: boolean
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { data: myMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!myMember) throw new Error("No family member found");

  const { data: row, error } = await supabase.from("time_capsules").insert({
    family_id: activeFamilyId,
    from_family_member_id: myMember.id,
    to_family_member_id: toFamilyMemberId,
    title: title.trim(),
    content: content.trim(),
    unlock_date: unlockDate,
    unlock_on_passing: unlockOnPassing ?? false,
  }).select("id").single();

  if (error) throw error;

  // Insert junction table rows for all selected recipients
  const ids = memberIds?.filter(Boolean) ?? [];
  if (row?.id && ids.length > 0) {
    await supabase.from("time_capsule_members").insert(
      ids.map((memberId) => ({ time_capsule_id: row.id, family_member_id: memberId }))
    );
  }

  revalidatePath("/dashboard/time-capsules");
}

export async function deleteTimeCapsule(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // RLS policy already ensures only sender can delete
  const { error } = await supabase.from("time_capsules").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/time-capsules");
  revalidatePath(`/dashboard/time-capsules/${id}`);
}

/**
 * Mark a family member as passed/remembered.
 * This triggers unlock_on_passing time capsules.
 */
export async function markMemberAsPassed(memberId: string, passedDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Only owners can mark members as passed
  const { data: myMember } = await supabase
    .from("family_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!myMember || myMember.role !== "owner") {
    throw new Error("Only the family owner can mark a member as passed");
  }

  const { error } = await supabase
    .from("family_members")
    .update({
      is_remembered: true,
      passed_date: passedDate,
    })
    .eq("id", memberId)
    .eq("family_id", activeFamilyId);

  if (error) throw error;
  revalidatePath("/dashboard/time-capsules");
  revalidatePath("/dashboard");
}
