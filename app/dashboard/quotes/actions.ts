"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

type Result = { success: boolean; error?: string; id?: string };

export async function addQuote(
  quote: string,
  saidBy: string,
  context: string,
  dateSaid: string
): Promise<Result> {
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
      .from("family_quotes")
      .insert({
        family_id: activeFamilyId,
        quote: quote.trim(),
        said_by: saidBy || null,
        context: context.trim() || null,
        date_said: dateSaid || null,
        added_by: myMember?.id ?? null,
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/quotes");
    return { success: true, id: data.id };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function deleteQuote(quoteId: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("family_quotes")
      .delete()
      .eq("id", quoteId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/quotes");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}
