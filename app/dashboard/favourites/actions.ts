"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type FavouriteCategory = "books" | "movies" | "shows" | "music" | "podcasts" | "games" | "recipes";

export async function addFavourite(
  category: FavouriteCategory,
  title: string,
  description?: string,
  notes?: string,
  familyMemberId?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: maxOrder } = await supabase
    .from("favourites")
    .select("sort_order")
    .eq("category", category)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const { error } = await supabase.from("favourites").insert({
    category,
    title,
    description: description || null,
    notes: notes || null,
    added_by: familyMemberId || null,
    sort_order: (maxOrder?.sort_order ?? -1) + 1,
  });

  if (error) throw error;
  revalidatePath("/dashboard/favourites");
  revalidatePath(`/dashboard/favourites/${category}`);
}

export async function updateFavourite(
  id: string,
  data: { title: string; description?: string; notes?: string; familyMemberId?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("favourites")
    .update({
      title: data.title,
      description: data.description || null,
      notes: data.notes || null,
      added_by: data.familyMemberId || null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/favourites");
  revalidatePath("/dashboard/favourites/books");
  revalidatePath("/dashboard/favourites/movies");
  revalidatePath("/dashboard/favourites/shows");
  revalidatePath("/dashboard/favourites/music");
  revalidatePath("/dashboard/favourites/podcasts");
  revalidatePath("/dashboard/favourites/games");
  revalidatePath("/dashboard/favourites/recipes");
}

export async function removeFavourite(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("favourites").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/favourites");
  revalidatePath("/dashboard/favourites/books");
  revalidatePath("/dashboard/favourites/movies");
  revalidatePath("/dashboard/favourites/shows");
  revalidatePath("/dashboard/favourites/music");
  revalidatePath("/dashboard/favourites/podcasts");
  revalidatePath("/dashboard/favourites/games");
  revalidatePath("/dashboard/favourites/recipes");
}
