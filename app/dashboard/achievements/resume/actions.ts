"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export async function upsertResume(familyMemberId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { error } = await supabase.from("family_resumes").upsert(
    {
      family_id: activeFamilyId,
      family_member_id: familyMemberId,
      content: content.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "family_member_id" }
  );

  if (error) throw error;
  revalidatePath("/dashboard/achievements");
  revalidatePath(`/dashboard/achievements/resume/${familyMemberId}`);
}
