"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { enforceStorageLimit, addStorageUsage, subtractStorageUsage } from "@/src/lib/plans";

export type FavouriteCategory = "books" | "movies" | "shows" | "music" | "toys" | "games" | "recipes";

const ALL_CATEGORIES: FavouriteCategory[] = ["books", "movies", "shows", "music", "toys", "games", "recipes"];

function revalidateAll(category?: FavouriteCategory) {
  revalidatePath("/dashboard/favourites");
  if (category) {
    revalidatePath(`/dashboard/favourites/${category}`);
  } else {
    for (const cat of ALL_CATEGORIES) {
      revalidatePath(`/dashboard/favourites/${cat}`);
    }
  }
}

/** Remove a favourite photo from storage and decrement the storage counter (G17) */
async function removeFavouritePhoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  photoUrl: string,
  familyId: string,
): Promise<void> {
  const storagePath = photoUrl.replace("/api/storage/favourite-photos/", "");
  if (!storagePath || storagePath === photoUrl) return;

  // Get file size before removal
  const { data: fileList } = await supabase.storage
    .from("favourite-photos")
    .list("", { search: storagePath });
  const fileSize = fileList?.[0]?.metadata?.size ?? 0;

  await supabase.storage.from("favourite-photos").remove([storagePath]);

  if (fileSize > 0) {
    await subtractStorageUsage(supabase, familyId, fileSize);
  }
}

async function uploadFavouritePhoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  photo: File,
  familyId: string
): Promise<string> {
  // Enforce storage limit before upload (G5)
  await enforceStorageLimit(supabase, familyId, photo.size);

  const ext = photo.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("favourite-photos")
    .upload(path, photo, { upsert: true });
  if (error) throw error;

  // Track storage after successful upload
  await addStorageUsage(supabase, familyId, photo.size);

  return `/api/storage/favourite-photos/${path}`;
}

export async function addFavourite(
  category: FavouriteCategory,
  title: string,
  memberId: string,
  description?: string,
  notes?: string,
  age?: number,
  photo?: File | null,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  let photoUrl: string | null = null;
  if (photo && photo.size > 0) {
    photoUrl = await uploadFavouritePhoto(supabase, photo, activeFamilyId);
  }

  const { error } = await supabase.from("favourites").insert({
    family_id: activeFamilyId,
    category,
    title,
    description: description || null,
    notes: notes || null,
    age: age ?? null,
    photo_url: photoUrl,
    added_by: memberId,
    member_id: memberId,
  });

  if (error) throw error;
  revalidateAll(category);
}

export async function updateFavourite(
  id: string,
  data: { title: string; description?: string; notes?: string; age?: number; photo?: File | null; clearPhoto?: boolean }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // If replacing or clearing photo, clean up the old one from storage (G17)
  if (data.clearPhoto || (data.photo && data.photo.size > 0)) {
    const { data: existing } = await supabase
      .from("favourites")
      .select("photo_url")
      .eq("id", id)
      .eq("family_id", activeFamilyId)
      .single();
    if (existing?.photo_url) {
      await removeFavouritePhoto(supabase, existing.photo_url, activeFamilyId);
    }
  }

  let photoUrl: string | undefined = undefined;
  if (data.clearPhoto) {
    photoUrl = null as unknown as undefined;
  } else if (data.photo && data.photo.size > 0) {
    photoUrl = await uploadFavouritePhoto(supabase, data.photo, activeFamilyId);
  }

  const update: Record<string, unknown> = {
    title: data.title,
    description: data.description || null,
    notes: data.notes || null,
    age: data.age ?? null,
  };
  if (photoUrl !== undefined || data.clearPhoto) {
    update.photo_url = data.clearPhoto ? null : photoUrl;
  }

  const { error } = await supabase
    .from("favourites")
    .update(update)
    .eq("id", id)
    .eq("family_id", activeFamilyId);

  if (error) throw error;
  revalidateAll();
}

export async function removeFavourite(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Clean up photo from storage before soft-deleting (G17)
  const { data: existing } = await supabase
    .from("favourites")
    .select("photo_url")
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();
  if (existing?.photo_url) {
    await removeFavouritePhoto(supabase, existing.photo_url, activeFamilyId);
  }

  const { error } = await supabase
    .from("favourites")
    .update({ removed_at: new Date().toISOString(), photo_url: null })
    .eq("id", id)
    .eq("family_id", activeFamilyId);

  if (error) throw error;
  revalidateAll();
}

export async function restoreFavourite(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { error } = await supabase
    .from("favourites")
    .update({ removed_at: null })
    .eq("id", id)
    .eq("family_id", activeFamilyId);

  if (error) throw error;
  revalidateAll();
}
