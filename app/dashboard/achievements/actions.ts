"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export type AddAchievementData = {
  familyMemberId?: string;
  what: string;
  achievementDate?: string;
  location?: string;
  description?: string;
};

export async function addAchievement(
  file: File | null,
  data: AddAchievementData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  let attachmentUrl: string | null = null;
  if (file && file.size > 0) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("achievements")
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("achievements")
      .getPublicUrl(path);
    attachmentUrl = urlData.publicUrl;
  }

  const { data: last } = await supabase
    .from("achievements")
    .select("sort_order")
    .eq("family_id", activeFamilyId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;

  const { error: insertError } = await supabase.from("achievements").insert({
    family_id: activeFamilyId,
    family_member_id: data.familyMemberId || null,
    what: data.what.trim(),
    achievement_date: data.achievementDate || null,
    location: data.location?.trim() || null,
    description: data.description?.trim() || null,
    attachment_url: attachmentUrl,
    sort_order: nextOrder,
  });

  if (insertError) throw insertError;
  revalidatePath("/dashboard/achievements");
}

export async function removeAchievement(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("achievements").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/achievements");
}
