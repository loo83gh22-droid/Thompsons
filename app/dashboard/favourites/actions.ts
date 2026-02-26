"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

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

async function uploadFavouritePhoto(supabase: Awaited<ReturnType<typeof createClient>>, photo: File): Promise<string> {
  const ext = photo.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("favourite-photos")
    .upload(path, photo, { upsert: true });
  if (error) throw error;
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
    photoUrl = await uploadFavouritePhoto(supabase, photo);
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

  let photoUrl: string | undefined = undefined;
  if (data.clearPhoto) {
    photoUrl = null as unknown as undefined;
  } else if (data.photo && data.photo.size > 0) {
    photoUrl = await uploadFavouritePhoto(supabase, data.photo);
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

  const { error } = await supabase
    .from("favourites")
    .update({ removed_at: new Date().toISOString() })
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
