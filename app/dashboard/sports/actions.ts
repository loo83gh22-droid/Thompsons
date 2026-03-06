"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { enforceStorageLimit, addStorageUsage, subtractStorageUsage } from "@/src/lib/plans";

export async function addSportsPhoto(
  file: File,
  data?: { title?: string; caption?: string; sport?: string; year?: number }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Enforce storage limit before upload (G8)
  await enforceStorageLimit(supabase, activeFamilyId, file.size);

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${activeFamilyId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("sports-photos")
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  // Track storage after upload
  await addStorageUsage(supabase, activeFamilyId, file.size);

  const { data: photos } = await supabase
    .from("sports_photos")
    .select("sort_order")
    .eq("family_id", activeFamilyId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (photos?.[0]?.sort_order ?? -1) + 1;

  const { error: insertError } = await supabase.from("sports_photos").insert({
    family_id: activeFamilyId,
    url: `/api/storage/sports-photos/${path}`,
    title: data?.title || null,
    caption: data?.caption || null,
    sport: data?.sport || null,
    year: data?.year || null,
    sort_order: nextOrder,
  });

  if (insertError) throw insertError;
  revalidatePath("/dashboard/sports");
}

export async function removeSportsPhoto(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Fetch the row first so we can clean up storage (B5/G8)
  const { data: row } = await supabase
    .from("sports_photos")
    .select("url")
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  const { error } = await supabase
    .from("sports_photos")
    .delete()
    .eq("id", id)
    .eq("family_id", activeFamilyId);

  if (error) throw error;

  // Remove storage object and decrement counter
  if (row?.url) {
    const storagePath = row.url.replace("/api/storage/sports-photos/", "");
    const { data: fileInfo } = await supabase.storage.from("sports-photos").list("", {
      search: storagePath,
    });
    const fileSize = fileInfo?.[0]?.metadata?.size ?? 0;
    await supabase.storage.from("sports-photos").remove([storagePath]);
    if (fileSize > 0) {
      await subtractStorageUsage(supabase, activeFamilyId, fileSize);
    }
  }

  revalidatePath("/dashboard/sports");
}
