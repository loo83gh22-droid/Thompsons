"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function toggleJournalShare(entryId: string): Promise<{ shareToken: string | null; isPublic: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: entry } = await supabase
    .from("journal_entries")
    .select("id, is_public, share_token")
    .eq("id", entryId)
    .single();

  if (!entry) throw new Error("Journal entry not found");

  if (entry.is_public) {
    // Unshare
    await supabase
      .from("journal_entries")
      .update({ is_public: false, share_token: null })
      .eq("id", entryId);

    revalidatePath("/dashboard/journal");
    return { shareToken: null, isPublic: false };
  } else {
    // Share — generate token
    const token = crypto.randomBytes(16).toString("hex");
    await supabase
      .from("journal_entries")
      .update({ is_public: true, share_token: token })
      .eq("id", entryId);

    revalidatePath("/dashboard/journal");
    return { shareToken: token, isPublic: true };
  }
}
