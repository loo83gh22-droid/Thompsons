"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleEmailNotifications(
  memberId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Verify the member belongs to the authenticated user
  const { data: member } = await supabase
    .from("family_members")
    .select("id")
    .eq("id", memberId)
    .eq("user_id", user.id)
    .single();

  if (!member) return { success: false, error: "Member not found" };

  const { error } = await supabase
    .from("family_members")
    .update({ email_notifications: enabled })
    .eq("id", memberId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}
