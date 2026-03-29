"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function toggleMemoShare(memoId: string): Promise<{ shareToken: string | null; isPublic: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: memo } = await supabase
    .from("voice_memos")
    .select("id, is_public, share_token")
    .eq("id", memoId)
    .single();

  if (!memo) throw new Error("Voice memo not found");

  if (memo.is_public) {
    // Unshare
    await supabase
      .from("voice_memos")
      .update({ is_public: false, share_token: null })
      .eq("id", memoId);

    revalidatePath("/dashboard/voice-memos");
    return { shareToken: null, isPublic: false };
  } else {
    // Share — generate token
    const token = crypto.randomBytes(16).toString("hex");
    await supabase
      .from("voice_memos")
      .update({ is_public: true, share_token: token })
      .eq("id", memoId);

    revalidatePath("/dashboard/voice-memos");
    return { shareToken: token, isPublic: true };
  }
}
