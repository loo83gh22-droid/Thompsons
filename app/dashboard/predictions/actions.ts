"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

type Result = { success: boolean; error?: string; id?: string };

export async function createPrediction(topic: string, targetDate: string): Promise<Result> {
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

    const { data, error } = await supabase
      .from("family_predictions")
      .insert({
        family_id: activeFamilyId,
        topic: topic.trim(),
        target_date: targetDate || null,
        created_by: myMember?.id ?? null,
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/predictions");
    return { success: true, id: data.id };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function addPredictionEntry(
  predictionId: string,
  memberId: string,
  prediction: string
): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { data, error } = await supabase
      .from("family_prediction_entries")
      .insert({
        prediction_id: predictionId,
        family_id: activeFamilyId,
        member_id: memberId || null,
        prediction: prediction.trim(),
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/predictions");
    return { success: true, id: data.id };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function resolveOutcome(
  predictionId: string,
  outcome: string,
  correctEntryIds: string[]
): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error: predError } = await supabase
      .from("family_predictions")
      .update({ outcome: outcome.trim(), resolved_at: new Date().toISOString() })
      .eq("id", predictionId)
      .eq("family_id", activeFamilyId);

    if (predError) return { success: false, error: predError.message };

    // Mark correct entries
    if (correctEntryIds.length > 0) {
      await supabase
        .from("family_prediction_entries")
        .update({ is_correct: true })
        .in("id", correctEntryIds)
        .eq("prediction_id", predictionId);

      await supabase
        .from("family_prediction_entries")
        .update({ is_correct: false })
        .not("id", "in", `(${correctEntryIds.map(() => "?").join(",")})`)
        .eq("prediction_id", predictionId);
    }

    revalidatePath("/dashboard/predictions");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function deletePrediction(predictionId: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("family_predictions")
      .delete()
      .eq("id", predictionId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/predictions");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}
