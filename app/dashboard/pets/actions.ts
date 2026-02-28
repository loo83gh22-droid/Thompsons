"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { enforceStorageLimit, addStorageUsage } from "@/src/lib/plans";
import crypto from "crypto";

export type PetResult = { success: true; id: string } | { success: false; error: string };

export async function addPet(formData: FormData): Promise<PetResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const name        = (formData.get("name") as string)?.trim();
    const species     = (formData.get("species") as string) || "dog";
    const breed       = (formData.get("breed") as string)?.trim() || null;
    const birthday    = (formData.get("birthday") as string)?.trim() || null;
    const adoptedDate = (formData.get("adopted_date") as string)?.trim() || null;
    const hasPassed   = formData.get("has_passed") === "true";
    const passedDate  = (formData.get("passed_date") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;
    const ownerMemberIds = formData.getAll("owner_member_ids[]") as string[];

    if (!name) return { success: false, error: "Pet name is required." };

    const { data: last } = await supabase
      .from("family_pets")
      .select("sort_order")
      .eq("family_id", activeFamilyId)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;

    const { data: pet, error: petError } = await supabase
      .from("family_pets")
      .insert({
        family_id:    activeFamilyId,
        name,
        species,
        breed,
        birthday:     birthday || null,
        adopted_date: adoptedDate || null,
        has_passed:   hasPassed,
        passed_date:  hasPassed ? (passedDate || null) : null,
        description,
        sort_order:   nextOrder,
      })
      .select("id")
      .single();

    if (petError || !pet) return { success: false, error: petError?.message ?? "Failed to save." };

    // Insert owner rows (empty = everyone's pet)
    const validOwners = ownerMemberIds.filter(Boolean);
    if (validOwners.length > 0) {
      await supabase.from("pet_owners").insert(
        validOwners.map((memberId) => ({
          pet_id:    pet.id,
          member_id: memberId,
          family_id: activeFamilyId,
        }))
      );
    }

    // Upload photos (up to 5)
    const allPhotos = formData.getAll("photos") as File[];
    const photos = allPhotos.filter((f) => f.size > 0).slice(0, 5);

    const totalBytes = photos.reduce((s, f) => s + f.size, 0);
    if (totalBytes > 0) {
      try { await enforceStorageLimit(supabase, activeFamilyId, totalBytes); } catch { /* skip photos */ }
    }

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${pet.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("pet-photos")
          .upload(path, file, { upsert: true });
        if (uploadError) continue;
        await addStorageUsage(supabase, activeFamilyId, file.size);
        await supabase.from("pet_photos").insert({
          family_id:  activeFamilyId,
          pet_id:     pet.id,
          url:        `/api/storage/pet-photos/${path}`,
          sort_order: i,
        });
      } catch { /* skip bad photos */ }
    }

    revalidatePath("/dashboard/pets");
    return { success: true, id: pet.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function updatePet(petId: string, formData: FormData): Promise<PetResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const name        = (formData.get("name") as string)?.trim();
    const species     = (formData.get("species") as string) || "dog";
    const breed       = (formData.get("breed") as string)?.trim() || null;
    const birthday    = (formData.get("birthday") as string)?.trim() || null;
    const adoptedDate = (formData.get("adopted_date") as string)?.trim() || null;
    const hasPassed   = formData.get("has_passed") === "true";
    const passedDate  = (formData.get("passed_date") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;
    const ownerMemberIds = formData.getAll("owner_member_ids[]") as string[];
    const photoIdsToDelete = formData.getAll("delete_photo_ids[]") as string[];

    if (!name) return { success: false, error: "Pet name is required." };

    // Update core fields
    const { error: updateError } = await supabase
      .from("family_pets")
      .update({
        name,
        species,
        breed,
        birthday:     birthday || null,
        adopted_date: adoptedDate || null,
        has_passed:   hasPassed,
        passed_date:  hasPassed ? (passedDate || null) : null,
        description,
      })
      .eq("id", petId)
      .eq("family_id", activeFamilyId);

    if (updateError) return { success: false, error: updateError.message };

    // Replace owners: delete all then re-insert
    await supabase.from("pet_owners").delete().eq("pet_id", petId);
    const validOwners = ownerMemberIds.filter(Boolean);
    if (validOwners.length > 0) {
      await supabase.from("pet_owners").insert(
        validOwners.map((memberId) => ({
          pet_id:    petId,
          member_id: memberId,
          family_id: activeFamilyId,
        }))
      );
    }

    // Delete marked photos
    const validPhotoDeletes = photoIdsToDelete.filter(Boolean);
    if (validPhotoDeletes.length > 0) {
      await supabase
        .from("pet_photos")
        .delete()
        .in("id", validPhotoDeletes)
        .eq("family_id", activeFamilyId);
    }

    // Upload new photos (respecting 5-photo cap)
    const { count: existingCount } = await supabase
      .from("pet_photos")
      .select("id", { count: "exact", head: true })
      .eq("pet_id", petId);

    const slots = Math.max(0, 5 - (existingCount ?? 0));
    const allNewPhotos = formData.getAll("new_photos") as File[];
    const newPhotos = allNewPhotos.filter((f) => f.size > 0).slice(0, slots);

    const totalBytes = newPhotos.reduce((s, f) => s + f.size, 0);
    if (totalBytes > 0) {
      try { await enforceStorageLimit(supabase, activeFamilyId, totalBytes); } catch { /* skip */ }
    }

    for (let i = 0; i < newPhotos.length; i++) {
      const file = newPhotos[i];
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${petId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("pet-photos")
          .upload(path, file, { upsert: true });
        if (uploadError) continue;
        await addStorageUsage(supabase, activeFamilyId, file.size);
        await supabase.from("pet_photos").insert({
          family_id:  activeFamilyId,
          pet_id:     petId,
          url:        `/api/storage/pet-photos/${path}`,
          sort_order: (existingCount ?? 0) + i,
        });
      } catch { /* skip */ }
    }

    revalidatePath("/dashboard/pets");
    return { success: true, id: petId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function removePet(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { error } = await supabase
    .from("family_pets")
    .delete()
    .eq("id", id)
    .eq("family_id", activeFamilyId);

  if (error) throw error;
  revalidatePath("/dashboard/pets");
}

export async function removePetPhoto(photoId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { error } = await supabase
    .from("pet_photos")
    .delete()
    .eq("id", photoId)
    .eq("family_id", activeFamilyId);

  if (error) throw error;
  revalidatePath("/dashboard/pets");
}
