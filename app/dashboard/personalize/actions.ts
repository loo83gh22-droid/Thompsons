"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { revalidatePath } from "next/cache";

export async function saveMyAliases(
  aliases: { targetMemberId: string; label: string }[]
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { data: currentMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!currentMember) throw new Error("Member record not found");

  const toUpsert = aliases
    .filter((a) => a.label.trim())
    .map((a) => ({
      viewer_member_id: currentMember.id,
      target_member_id: a.targetMemberId,
      label: a.label.trim(),
    }));

  const toDelete = aliases
    .filter((a) => !a.label.trim())
    .map((a) => a.targetMemberId);

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from("member_aliases")
      .upsert(toUpsert, { onConflict: "viewer_member_id,target_member_id" });
    if (error) throw error;
  }

  if (toDelete.length > 0) {
    await supabase
      .from("member_aliases")
      .delete()
      .eq("viewer_member_id", currentMember.id)
      .in("target_member_id", toDelete);
  }

  revalidatePath("/dashboard/our-family");
  revalidatePath("/dashboard/personalize");
}
