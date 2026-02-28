"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { enforceStorageLimit, addStorageUsage } from "@/src/lib/plans";
import crypto from "crypto";

export type TrophyResult = { success: true; id: string } | { success: false; error: string };

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "heic", "avif"];

function detectFileType(file: File): "image" | "document" {
  if (file.type.startsWith("image/")) return "image";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTS.includes(ext) ? "image" : "document";
}

export async function createTrophy(formData: FormData): Promise<TrophyResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const category = (formData.get("category") as string) || "other";
    const awardedBy = (formData.get("awarded_by") as string)?.trim() || null;
    const awardDate = (formData.get("award_date") as string) || null;
    const memberIds = (formData.getAll("member_ids") as string[]).filter(Boolean);

    if (!title) return { success: false, error: "Title is required." };
    if (memberIds.length === 0) return { success: false, error: "Please select at least one family member." };

    const { data: trophy, error: insertError } = await supabase
      .from("awards")
      .insert({
        family_id: activeFamilyId,
        title,
        description,
        category,
        awarded_by: awardedBy,
        award_date: awardDate || null,
      })
      .select("id")
      .single();

    if (insertError || !trophy) return { success: false, error: insertError?.message ?? "Failed to save." };

    await supabase.from("award_members").insert(
      memberIds.map((memberId) => ({ award_id: trophy.id, family_member_id: memberId }))
    );

    const allFiles = formData.getAll("files") as File[];
    const files = allFiles.filter((f) => f.size > 0).slice(0, 5);

    const totalBytes = files.reduce((s, f) => s + f.size, 0);
    if (totalBytes > 0) {
      try { await enforceStorageLimit(supabase, activeFamilyId, totalBytes); } catch { /* skip files, don't fail trophy creation */ }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${trophy.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("award-files")
          .upload(path, file, { upsert: true });
        if (uploadError) continue;
        await addStorageUsage(supabase, activeFamilyId, file.size);
        await supabase.from("award_files").insert({
          family_id: activeFamilyId,
          award_id: trophy.id,
          url: `/api/storage/award-files/${path}`,
          file_type: detectFileType(file),
          file_name: file.name,
          sort_order: i,
        });
      } catch { /* skip bad files */ }
    }

    revalidatePath("/dashboard/trophy-case");
    for (const memberId of memberIds) {
      revalidatePath(`/dashboard/trophy-case/${memberId}`);
    }
    return { success: true, id: trophy.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function updateTrophy(
  trophyId: string,
  formData: FormData
): Promise<TrophyResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const category = (formData.get("category") as string) || "other";
    const awardedBy = (formData.get("awarded_by") as string)?.trim() || null;
    const awardDate = (formData.get("award_date") as string) || null;
    const memberIds = (formData.getAll("member_ids") as string[]).filter(Boolean);

    if (!title) return { success: false, error: "Title is required." };
    if (memberIds.length === 0) return { success: false, error: "Please select at least one family member." };

    const { error: updateError } = await supabase
      .from("awards")
      .update({
        title,
        description,
        category,
        awarded_by: awardedBy,
        award_date: awardDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", trophyId)
      .eq("family_id", activeFamilyId);

    if (updateError) return { success: false, error: updateError.message };

    await supabase.from("award_members").delete().eq("award_id", trophyId);
    await supabase.from("award_members").insert(
      memberIds.map((memberId) => ({ award_id: trophyId, family_member_id: memberId }))
    );

    const allFiles = formData.getAll("files") as File[];
    const newFiles = allFiles.filter((f) => f.size > 0);

    if (newFiles.length > 0) {
      const { count } = await supabase
        .from("award_files")
        .select("id", { count: "exact", head: true })
        .eq("award_id", trophyId);
      const existing = count ?? 0;
      const toAdd = newFiles.slice(0, Math.max(0, 5 - existing));

      for (let i = 0; i < toAdd.length; i++) {
        const file = toAdd[i];
        try {
          const ext = file.name.split(".").pop() || "bin";
          const path = `${trophyId}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("award-files")
            .upload(path, file, { upsert: true });
          if (uploadError) continue;
          await addStorageUsage(supabase, activeFamilyId, file.size);
          await supabase.from("award_files").insert({
            family_id: activeFamilyId,
            award_id: trophyId,
            url: `/api/storage/award-files/${path}`,
            file_type: detectFileType(file),
            file_name: file.name,
            sort_order: existing + i,
          });
        } catch { /* skip */ }
      }
    }

    revalidatePath("/dashboard/trophy-case");
    for (const memberId of memberIds) {
      revalidatePath(`/dashboard/trophy-case/${memberId}`);
    }
    return { success: true, id: trophyId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function deleteTrophy(trophyId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { data: files } = await supabase
    .from("award_files")
    .select("url")
    .eq("award_id", trophyId)
    .eq("family_id", activeFamilyId);

  if (files && files.length > 0) {
    // Handle files from both the award-files bucket and legacy achievements bucket
    const awardFilePaths = files
      .filter((f) => f.url.startsWith("/api/storage/award-files/"))
      .map((f) => f.url.replace("/api/storage/award-files/", ""));
    const achievementPaths = files
      .filter((f) => f.url.startsWith("/api/storage/achievements/"))
      .map((f) => f.url.replace("/api/storage/achievements/", ""));

    if (awardFilePaths.length > 0) {
      await supabase.storage.from("award-files").remove(awardFilePaths);
    }
    if (achievementPaths.length > 0) {
      await supabase.storage.from("achievements").remove(achievementPaths);
    }
  }

  const { data: members } = await supabase
    .from("award_members")
    .select("family_member_id")
    .eq("award_id", trophyId);

  await supabase
    .from("awards")
    .delete()
    .eq("id", trophyId)
    .eq("family_id", activeFamilyId);

  revalidatePath("/dashboard/trophy-case");
  for (const m of members ?? []) {
    revalidatePath(`/dashboard/trophy-case/${m.family_member_id}`);
  }
}

export async function deleteTrophyFile(
  fileId: string,
  trophyId: string,
  memberId: string
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { data: file } = await supabase
    .from("award_files")
    .select("url")
    .eq("id", fileId)
    .eq("family_id", activeFamilyId)
    .single();

  if (file) {
    if (file.url.startsWith("/api/storage/award-files/")) {
      const path = file.url.replace("/api/storage/award-files/", "");
      await supabase.storage.from("award-files").remove([path]);
    } else if (file.url.startsWith("/api/storage/achievements/")) {
      const path = file.url.replace("/api/storage/achievements/", "");
      await supabase.storage.from("achievements").remove([path]);
    }
  }

  await supabase
    .from("award_files")
    .delete()
    .eq("id", fileId)
    .eq("family_id", activeFamilyId);

  revalidatePath(`/dashboard/trophy-case/${memberId}/${trophyId}`);
}
