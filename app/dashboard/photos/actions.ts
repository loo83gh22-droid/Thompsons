"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { enforceStorageLimit, addStorageUsage, subtractStorageUsage } from "@/src/lib/plans";

export async function addPhoto(file: File, takenAt?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Enforce storage limit
  await enforceStorageLimit(supabase, activeFamilyId, file.size);

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("home-mosaic")
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  // Track storage usage
  await addStorageUsage(supabase, activeFamilyId, file.size);

  const { data: photos } = await supabase
    .from("home_mosaic_photos")
    .select("sort_order")
    .eq("family_id", activeFamilyId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = photos?.[0]?.sort_order != null ? photos[0].sort_order + 1 : 0;

  // Get uploader's family_member id
  const { data: myMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  const { data: inserted, error: insertError } = await supabase
    .from("home_mosaic_photos")
    .insert({
      family_id: activeFamilyId,
      url: `/api/storage/home-mosaic/${path}`,
      sort_order: nextOrder,
      uploaded_by: myMember?.id || null,
      taken_at: takenAt || null,
      file_size_bytes: file.size,
    })
    .select("id, url, sort_order, taken_at, created_at")
    .single();

  if (insertError) {
    // Rollback: DB insert failed after storage upload succeeded (W2)
    await supabase.storage.from("home-mosaic").remove([path]);
    await subtractStorageUsage(supabase, activeFamilyId, file.size);
    throw insertError;
  }

  revalidatePath("/");
  revalidatePath("/dashboard/photos");
  return inserted;
}

export async function removePhoto(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Fetch before deleting so we can clean up storage (W2)
  const { data: photo } = await supabase
    .from("home_mosaic_photos")
    .select("url, file_size_bytes")
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  const { error } = await supabase
    .from("home_mosaic_photos")
    .delete()
    .eq("id", id)
    .eq("family_id", activeFamilyId);

  if (error) throw error;

  // Remove file from storage and decrement counter (W2)
  if (photo?.url) {
    const storagePath = photo.url.replace("/api/storage/home-mosaic/", "");
    await supabase.storage.from("home-mosaic").remove([storagePath]);
  }
  if (photo?.file_size_bytes && photo.file_size_bytes > 0) {
    await subtractStorageUsage(supabase, activeFamilyId, photo.file_size_bytes);
  }

  revalidatePath("/");
  revalidatePath("/dashboard/photos");
}
