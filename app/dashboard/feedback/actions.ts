"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { revalidatePath } from "next/cache";

export type FeedbackCategory = "feature_request" | "bug_report" | "question" | "compliment" | "other";
export type FeedbackStatus = "new" | "read" | "in_progress" | "resolved" | "wont_fix";

export type SubmitFeedbackResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function submitFeedback(
  category: FeedbackCategory,
  subject: string,
  body: string,
  rating: number | null,
  screenshotUrl: string | null,
  pageUrl: string | null,
): Promise<SubmitFeedbackResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { data: myMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single();
    if (!myMember) return { success: false, error: "Family member not found" };

    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();
    if (!trimmedSubject || trimmedSubject.length > 200) return { success: false, error: "Subject must be 1-200 characters" };
    if (!trimmedBody || trimmedBody.length > 5000) return { success: false, error: "Body must be 1-5000 characters" };

    const { data: feedback, error: insertError } = await supabase
      .from("feedback")
      .insert({
        family_id: activeFamilyId,
        member_id: myMember.id,
        user_id: user.id,
        category,
        subject: trimmedSubject,
        body: trimmedBody,
        rating,
        screenshot_url: screenshotUrl,
        page_url: pageUrl,
      })
      .select("id")
      .single();

    if (insertError || !feedback) return { success: false, error: insertError?.message ?? "Failed to submit feedback" };

    revalidatePath("/dashboard/feedback");
    return { success: true, id: feedback.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unexpected error" };
  }
}

export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("feedback")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", feedbackId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/feedback");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unexpected error" };
  }
}

export async function respondToFeedback(
  feedbackId: string,
  response: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const trimmed = response.trim();
    if (!trimmed) return { success: false, error: "Response cannot be empty" };

    const { error } = await supabase
      .from("feedback")
      .update({
        admin_response: trimmed,
        responded_at: new Date().toISOString(),
        status: "read",
        updated_at: new Date().toISOString(),
      })
      .eq("id", feedbackId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/feedback");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unexpected error" };
  }
}

export async function deleteFeedback(
  feedbackId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("feedback")
      .delete()
      .eq("id", feedbackId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/feedback");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unexpected error" };
  }
}

export async function hasRecentFeedback(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { count } = await supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", fourteenDaysAgo.toISOString());

    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}
