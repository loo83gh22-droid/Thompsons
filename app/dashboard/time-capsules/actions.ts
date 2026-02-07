"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export async function createTimeCapsule(
  toFamilyMemberId: string,
  title: string,
  content: string,
  unlockDate: string
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

  const { error } = await supabase.from("time_capsules").insert({
    family_id: activeFamilyId,
    from_family_member_id: myMember.id,
    to_family_member_id: toFamilyMemberId,
    title: title.trim(),
    content: content.trim(),
    unlock_date: unlockDate,
  });

  if (error) throw error;
  revalidatePath("/dashboard/time-capsules");
}

export async function deleteTimeCapsule(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("time_capsules").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/time-capsules");
  revalidatePath(`/dashboard/time-capsules/${id}`);
}
