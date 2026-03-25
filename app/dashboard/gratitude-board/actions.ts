"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export async function postGratitude(content: string, memberId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    if (!content.trim()) return { success: false, error: "Please write something." };
    if (content.length > 280) return { success: false, error: "Keep it under 280 characters." };

    const { error } = await supabase.from("gratitude_posts").insert({
      family_id: activeFamilyId,
      member_id: memberId,
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

    const { error } = await supabase.from("gratitude_posts").delete()
      .eq("id", postId).eq("family_id", activeFamilyId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/gratitude-board");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}
