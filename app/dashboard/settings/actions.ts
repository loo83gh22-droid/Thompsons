"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
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

export async function saveSpotifyPlaylist(
  playlistId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { success: false, error: "No active family" };

  // Verify user is owner or adult in this family
  const { data: member } = await supabase
    .from("family_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!member || !["owner", "adult"].includes(member.role)) {
    return { success: false, error: "Only owners and adults can update the playlist" };
  }

  // Extract just the playlist ID if a full URL was pasted
  const extracted = playlistId.trim().match(/(?:playlist\/)([A-Za-z0-9]+)/)?.[1] ?? playlistId.trim();
  const cleaned = extracted || null;

  const { error } = await supabase
    .from("families")
    .update({ spotify_playlist_id: cleaned })
    .eq("id", activeFamilyId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { success: true };
}
