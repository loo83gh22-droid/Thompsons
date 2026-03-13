"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { addStorageUsage, subtractStorageUsage } from "@/src/lib/plans";
import type { UploadedFileMeta } from "@/src/lib/uploadedFileMeta";

export type TrophyResult = { success: true; id: string } | { success: false; error: string };

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

    // Save file records (files already uploaded client-side to Supabase storage)
    const filesJson = formData.get("files_meta") as string | null;
    const filesMeta: UploadedFileMeta[] = filesJson ? JSON.parse(filesJson) : [];

    for (let i = 0; i < filesMeta.length; i++) {
      const meta = filesMeta[i];
      const { error: fileErr } = await supabase.from("award_files").insert({
        family_id:       activeFamilyId,
        award_id:        trophy.id,
        url:             meta.url,
        file_type:       meta.fileType || "document",
        file_name:       meta.fileName || null,
        sort_order:      i,
        file_size_bytes: meta.fileSize,
      });
      if (fileErr) {
        await supabase.storage.from("award-files").remove([meta.storagePath]);
      } else {
        await addStorageUsage(supabase, activeFamilyId, meta.fileSize);
      }
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

    // Save new file records (files already uploaded client-side to Supabase storage)
    const newFilesJson = formData.get("files_meta") as string | null;
    const newFilesMeta: UploadedFileMeta[] = newFilesJson ? JSON.parse(newFilesJson) : [];

    if (newFilesMeta.length > 0) {
      const { count } = await supabase
        .from("award_files")
        .select("id", { count: "exact", head: true })
        .eq("award_id", trophyId);
      const existing = count ?? 0;

      for (let i = 0; i < newFilesMeta.length; i++) {
        const meta = newFilesMeta[i];
        const { error: fileErr } = await supabase.from("award_files").insert({
          family_id:       activeFamilyId,
          award_id:        trophyId,
          url:             meta.url,
          file_type:       meta.fileType || "document",
          file_name:       meta.fileName || null,
          sort_order:      existing + i,
          file_size_bytes: meta.fileSize,
        });
        if (fileErr) {
          await supabase.storage.from("award-files").remove([meta.storagePath]);
        } else {
          await addStorageUsage(supabase, activeFamilyId, meta.fileSize);
        }
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

export async function deleteTrophy(trophyId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { error: "No active family" };

    const { data: files } = await supabase
      .from("award_files")
      .select("url, file_size_bytes")
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

      // Decrement storage counter for all removed files (W16)
      const totalBytes = files.reduce((sum, f) => sum + (f.file_size_bytes ?? 0), 0);
      if (totalBytes > 0) {
        await subtractStorageUsage(supabase, activeFamilyId, totalBytes);
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
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function deleteTrophyFile(
  fileId: string,
  trophyId: string,
  memberId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { error: "No active family" };

    const { data: file } = await supabase
      .from("award_files")
      .select("url, file_size_bytes")
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

      // Decrement storage counter (W16)
      if (file.file_size_bytes > 0) {
        await subtractStorageUsage(supabase, activeFamilyId, file.file_size_bytes);
      }
    }

    await supabase
      .from("award_files")
      .delete()
      .eq("id", fileId)
      .eq("family_id", activeFamilyId);

    revalidatePath(`/dashboard/trophy-case/${memberId}/${trophyId}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}
