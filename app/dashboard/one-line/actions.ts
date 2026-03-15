"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { revalidatePath } from "next/cache";

export async function saveOneLineEntry(
  date: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 300)
      return { success: false, error: "Entry must be 1–300 characters" };

    const { error } = await supabase.from("one_line_entries").upsert(
      {
        user_id: user.id,
        family_id: activeFamilyId,
        entry_date: date,
        content: trimmed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,entry_date" }
    );

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/one-line");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong",
    };
  }
}

export async function deleteOneLineEntry(entryId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    await supabase
      .from("one_line_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", user.id);

    revalidatePath("/dashboard/one-line");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}
