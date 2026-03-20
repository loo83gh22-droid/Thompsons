"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import {
  getFamilyPlan,
  checkFeatureLimit,
  enforceStorageLimit,
  addStorageUsage,
  subtractStorageUsage,
} from "@/src/lib/plans";

/**
 * Add a tradition, optionally with a photo.
 *
 * Photo upload and DB insert are handled in a single server action so that
 * a failure between the two cannot leave an orphaned storage file or an
 * inflated storage_used_bytes counter.
 */
export async function addTradition(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Enforce tradition limit
  const plan = await getFamilyPlan(supabase, activeFamilyId);
  const limitError = await checkFeatureLimit(supabase, activeFamilyId, plan.planType, "traditions", "family_traditions");
  if (limitError) throw new Error(limitError);

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() ?? "";
  const whenItHappens = (formData.get("whenItHappens") as string | null)?.trim() || null;
  const addedById = (formData.get("addedById") as string | null) || null;
  const photoFile = formData.get("photo") as File | null;

  if (!title || !description) throw new Error("Title and description are required");

  // --- Optional photo upload ---
  let photoUrl: string | null = null;
  let uploadedPath: string | null = null;
  let uploadedSize = 0;

  if (photoFile && photoFile.size > 0) {
    await enforceStorageLimit(supabase, activeFamilyId, photoFile.size);

    const ext = photoFile.name.split(".").pop() ?? "jpg";
    uploadedPath = `${activeFamilyId}/traditions/${crypto.randomUUID()}.${ext}`;
    uploadedSize = photoFile.size;

    const bytes = await photoFile.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("tradition-photos")
      .upload(uploadedPath, bytes, { contentType: photoFile.type, upsert: false });
    if (uploadError) throw new Error("Photo upload failed: " + uploadError.message);

    await addStorageUsage(supabase, activeFamilyId, uploadedSize);
    photoUrl = `/api/storage/tradition-photos/${uploadedPath}`;
  }

  // --- DB insert ---
  const { data: last } = await supabase
    .from("family_traditions")
    .select("sort_order")
    .eq("family_id", activeFamilyId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;

  const { error: insertError } = await supabase.from("family_traditions").insert({
    family_id: activeFamilyId,
    title,
    description,
    when_it_happens: whenItHappens,
    added_by: addedById,
    sort_order: nextOrder,
    photo_url: photoUrl,
  });

  if (insertError) {
    // Roll back the storage upload so nothing is orphaned
    if (uploadedPath) {
      await supabase.storage.from("tradition-photos").remove([uploadedPath]);
      await subtractStorageUsage(supabase, activeFamilyId, uploadedSize);
    }
    throw insertError;
  }

  revalidatePath("/dashboard/traditions");
}

export async function updateTradition(
  id: string,
  data: { title?: string; description?: string; whenItHappens?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { error } = await supabase
    .from("family_traditions")
    .update({
      title: data.title?.trim(),
      description: data.description?.trim(),
      when_it_happens: data.whenItHappens?.trim() || null,
    })
    .eq("id", id)
    .eq("family_id", activeFamilyId);

  if (error) throw error;
  revalidatePath("/dashboard/traditions");
}

export async function removeTradition(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Fetch the tradition first so we can clean up its photo
  const { data: tradition } = await supabase
    .from("family_traditions")
    .select("photo_url")
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  const { error } = await supabase
    .from("family_traditions")
    .delete()
    .eq("id", id)
    .eq("family_id", activeFamilyId);
  if (error) throw error;

  // Clean up photo from storage and decrement storage counter
  if (tradition?.photo_url) {
    const proxyPrefix = "/api/storage/tradition-photos/";
    if (tradition.photo_url.startsWith(proxyPrefix)) {
      const storagePath = tradition.photo_url.slice(proxyPrefix.length);
      const { data: fileInfo } = await supabase.storage
        .from("tradition-photos")
        .list(storagePath.split("/").slice(0, -1).join("/"), {
          search: storagePath.split("/").at(-1),
        });
      const fileSize = fileInfo?.[0]?.metadata?.size ?? 0;
      await supabase.storage.from("tradition-photos").remove([storagePath]);
      if (fileSize > 0) {
        await subtractStorageUsage(supabase, activeFamilyId, fileSize);
      }
    }
  }

  revalidatePath("/dashboard/traditions");
}
