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

export async function addFavourite(
  category: FavouriteCategory,
  title: string,
  memberId: string,
  description?: string,
  notes?: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { error } = await supabase.from("favourites").insert({
    family_id: activeFamilyId,
    category,
    title,
    description: description || null,
    notes: notes || null,
    added_by: memberId,
    member_id: memberId,
  });

  if (error) throw error;
  revalidateAll(category);
}

export async function updateFavourite(
  id: string,
  data: { title: string; description?: string; notes?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { error } = await supabase
    .from("favourites")
    .update({
      title: data.title,
      description: data.description || null,
      notes: data.notes || null,
    })
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
