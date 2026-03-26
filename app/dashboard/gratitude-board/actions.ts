"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export async function postGratitude(content: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    if (!content.trim()) return { success: false, error: "Please write something." };
    if (content.length > 280) return { success: false, error: "Keep it under 280 characters." };

    // Derive memberId server-side — never trust client-supplied member identity
    const { data: member } = await supabase
      .from("family_members").select("id").eq("family_id", activeFamilyId).eq("user_id", user.id).single();
    if (!member) return { success: false, error: "Member not found." };

    const { error } = await supabase.from("gratitude_posts").insert({
      family_id: activeFamilyId,
      member_id: member.id,
      content: content.trim(),
    });
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/gratitude-board");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function deleteGratitude(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    // Derive caller's member record server-side
    const { data: member } = await supabase
      .from("family_members").select("id, role").eq("family_id", activeFamilyId).eq("user_id", user.id).single();
    if (!member) return { success: false, error: "Member not found." };

    // Owner/adult can delete any post; others can only delete their own
    const isPrivileged = member.role === "owner" || member.role === "adult";
    const query = supabase.from("gratitude_posts").delete().eq("id", postId).eq("family_id", activeFamilyId);
    const { error } = isPrivileged ? await query : await query.eq("member_id", member.id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/gratitude-board");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}
