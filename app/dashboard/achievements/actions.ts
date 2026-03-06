"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/src/lib/requireRole";
import { enforceStorageLimit, addStorageUsage, subtractStorageUsage } from "@/src/lib/plans";

export type AddAchievementData = {
  familyMemberId?: string;
  memberIds?: string[];
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
  // Only owners and adults can create achievements — prevents teens from
  // adding achievements on behalf of other family members.
  const { familyId: activeFamilyId } = await requireRole(supabase, user.id, ["owner", "adult"]);

  let attachmentUrl: string | null = null;
  if (file && file.size > 0) {
    // Enforce storage limit before upload (G6)
    await enforceStorageLimit(supabase, activeFamilyId, file.size);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("achievements")
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Track storage after successful upload
    await addStorageUsage(supabase, activeFamilyId, file.size);

    attachmentUrl = `/api/storage/achievements/${path}`;
  }

  const { data: last } = await supabase
    .from("achievements")
    .select("sort_order")
    .eq("family_id", activeFamilyId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;

  const { data: row, error: insertError } = await supabase.from("achievements").insert({
    family_id: activeFamilyId,
    family_member_id: data.familyMemberId || null,
    what: data.what.trim(),
    achievement_date: data.achievementDate || null,
    location: data.location?.trim() || null,
    description: data.description?.trim() || null,
    attachment_url: attachmentUrl,
    sort_order: nextOrder,
  }).select("id").single();

  if (insertError) throw insertError;

  // Insert junction table rows for all selected members
  const ids = data.memberIds?.filter(Boolean) ?? [];
  if (row?.id && ids.length > 0) {
    await supabase.from("achievement_members").insert(
      ids.map((memberId) => ({ achievement_id: row.id, family_member_id: memberId }))
    );
  }

  revalidatePath("/dashboard/achievements");
}

export async function removeAchievement(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  // Only owners and adults can delete achievements.
  const { familyId: activeFamilyId } = await requireRole(supabase, user.id, ["owner", "adult"]);

  // Fetch the attachment URL so we can remove it from storage (B5)
  const { data: row } = await supabase
    .from("achievements")
    .select("attachment_url")
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  const { error } = await supabase.from("achievements").delete().eq("id", id).eq("family_id", activeFamilyId);
  if (error) throw error;

  // Remove the file from storage and decrement the counter
  if (row?.attachment_url) {
    const storagePath = row.attachment_url.replace("/api/storage/achievements/", "");
    const { data: fileInfo } = await supabase.storage.from("achievements").list("", {
      search: storagePath,
    });
    const fileSize = fileInfo?.[0]?.metadata?.size ?? 0;
    await supabase.storage.from("achievements").remove([storagePath]);
    if (fileSize > 0) {
      await subtractStorageUsage(supabase, activeFamilyId, fileSize);
    }
  }

  revalidatePath("/dashboard/achievements");
}
