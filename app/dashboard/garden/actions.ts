"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { addStorageUsage, subtractStorageUsage } from "@/src/lib/plans";

export type GardenResult = { success: true; id: string } | { success: false; error: string };
type Result = { success: boolean; error?: string };

export async function createGardenEntry(formData: FormData): Promise<GardenResult> {
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

    const season = (formData.get("season") as string)?.trim();
    if (!season) return { success: false, error: "Season is required." };

    const yearRaw = (formData.get("year") as string)?.trim();
    const year = yearRaw ? parseInt(yearRaw) : new Date().getFullYear();
    const title = (formData.get("title") as string)?.trim() || null;
    const notes = (formData.get("notes") as string)?.trim() || null;

    const { data: entry, error } = await supabase
      .from("garden_entries")
      .insert({
        family_id: activeFamilyId,
        season,
        year,
        title,
        notes,
        created_by: myMember?.id ?? null,
      })
      .select("id")
      .single();

    if (error || !entry?.id) return { success: false, error: error?.message ?? "Failed to save." };

    // Plants
    let plants: { name: string; type: string; yield_notes: string }[] = [];
    try { plants = JSON.parse((formData.get("plants") as string) || "[]"); } catch { /* ignore */ }

    if (plants.length > 0) {
      await supabase.from("garden_plants").insert(
        plants.filter(p => p.name.trim()).map(p => ({
          entry_id: entry.id,
          family_id: activeFamilyId,
          name: p.name.trim(),
          type: p.type || null,
          yield_notes: p.yield_notes?.trim() || null,
        }))
      );
    }

    revalidatePath("/dashboard/garden");
    return { success: true, id: entry.id };
  } catch (err) {
    console.error("[createGardenEntry]", err);
    return { success: false, error: "Something went wrong." };
  }
}

export async function deleteGardenEntry(entryId: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("garden_entries")
      .delete()
      .eq("id", entryId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/garden");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function registerGardenPhoto(
  entryId: string,
  storagePath: string,
  fileSize: number
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return null;

    const { data: myMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single();

    const { data: photo, error } = await supabase
      .from("garden_photos")
      .insert({
        entry_id: entryId,
        family_id: activeFamilyId,
        storage_path: storagePath,
        bucket: "garden-photos",
        size_bytes: fileSize,
        uploaded_by: myMember?.id ?? null,
      })
      .select("id")
      .single();

    if (error) { console.error("[registerGardenPhoto]", error.message); return null; }
    await addStorageUsage(supabase, activeFamilyId, fileSize);
    return photo.id;
  } catch {
    return null;
  }
}

export async function setGardenCoverPhoto(entryId: string, storagePath: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("garden_entries")
      .update({ cover_photo_path: storagePath, cover_photo_bucket: "garden-photos" })
      .eq("id", entryId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/garden");
    revalidatePath(`/dashboard/garden/${entryId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function deleteGardenPhoto(photoId: string, entryId: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { data: photo } = await supabase
      .from("garden_photos")
      .select("storage_path, size_bytes")
      .eq("id", photoId)
      .eq("family_id", activeFamilyId)
      .single();

    const { error } = await supabase
      .from("garden_photos")
      .delete()
      .eq("id", photoId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };

    if (photo) {
      await supabase.storage.from("garden-photos").remove([photo.storage_path]);
      await subtractStorageUsage(supabase, activeFamilyId, photo.size_bytes ?? 0);
    }

    revalidatePath(`/dashboard/garden/${entryId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}
