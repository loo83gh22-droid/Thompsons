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

/* ── Theme ─────────────────────────────────────────────── */

const VALID_THEMES = ["warm", "ocean", "forest", "sunset", "lavender", "midnight", "vintage", "nineties"];

export async function setUserTheme(
  theme: string
): Promise<{ success: boolean; error?: string }> {
  if (!VALID_THEMES.includes(theme)) {
    return { success: false, error: "Invalid theme" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      { user_id: user.id, theme, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

/* ── Account Deletion ─────────────────────────────────────── */

export async function requestAccountDeletion(): Promise<{
  success: boolean;
  error?: string;
  deleteAfter?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Check if there's already a pending request
  const { data: existing } = await supabase
    .from("account_deletion_requests")
    .select("id, delete_after")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: "You already have a pending deletion request.",
      deleteAfter: existing.delete_after,
    };
  }

  const { data, error } = await supabase
    .from("account_deletion_requests")
    .insert({ user_id: user.id })
    .select("delete_after")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true, deleteAfter: data.delete_after };
}

export async function cancelAccountDeletion(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("account_deletion_requests")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function getAccountDeletionStatus(): Promise<{
  pending: boolean;
  deleteAfter?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { pending: false };

  const { data } = await supabase
    .from("account_deletion_requests")
    .select("delete_after")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (!data) return { pending: false };
  return { pending: true, deleteAfter: data.delete_after };
}
