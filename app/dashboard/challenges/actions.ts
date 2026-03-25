"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export type ChallengeType = "single" | "daily";

export type ChallengeResult = { success: true; id: string } | { success: false; error: string };

export async function createChallenge(formData: FormData): Promise<ChallengeResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { data: member } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", activeFamilyId)
      .eq("user_id", user.id)
      .single();
    if (!member) return { success: false, error: "Member not found" };

    const title = (formData.get("title") as string)?.trim();
    if (!title) return { success: false, error: "Title is required" };

    const emoji = (formData.get("emoji") as string) || "🎯";
    const description = (formData.get("description") as string)?.trim() || null;
    const challenge_type = (formData.get("challenge_type") as ChallengeType) || "single";
    const durationStr = formData.get("duration_days") as string | null;
    const duration_days = durationStr ? parseInt(durationStr, 10) : null;

    const end_date = duration_days
      ? new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      : null;

    const { data, error } = await supabase
      .from("family_challenges")
      .insert({
        family_id: activeFamilyId,
        created_by_member_id: member.id,
        title,
        emoji,
        description,
        challenge_type,
        duration_days,
        end_date,
      })
      .select("id")
      .single();

    if (error || !data) return { success: false, error: error?.message ?? "Failed to create" };

    revalidatePath("/dashboard/challenges");
    return { success: true, id: data.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function markDone(
  challengeId: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("challenge_completions")
      .insert({ challenge_id: challengeId, family_member_id: memberId });

    // Ignore unique violation — already done
    if (error && !error.message.includes("unique")) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/challenges");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function checkInToday(
  challengeId: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase
      .from("challenge_checkins")
      .insert({ challenge_id: challengeId, family_member_id: memberId, checkin_date: today });

    if (error && !error.message.includes("unique")) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/challenges");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function completeChallenge(
  challengeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("family_challenges")
      .update({ status: "completed" })
      .eq("id", challengeId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/challenges");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function deleteChallenge(
  challengeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("family_challenges")
      .delete()
      .eq("id", challengeId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/challenges");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong" };
  }
}
