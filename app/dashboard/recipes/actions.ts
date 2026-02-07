"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export async function addRecipe(data: {
  title: string;
  story?: string;
  taughtById?: string;
  occasions?: string;
  ingredients?: string;
  instructions?: string;
  addedById?: string;
  photoIds?: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { data: last } = await supabase
    .from("recipes")
    .select("sort_order")
    .eq("family_id", activeFamilyId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;

  const { data: recipe, error: insertError } = await supabase
    .from("recipes")
    .insert({
      family_id: activeFamilyId,
      title: data.title.trim(),
      story: data.story?.trim() || null,
      taught_by: data.taughtById || null,
      occasions: data.occasions?.trim() || null,
      ingredients: data.ingredients?.trim() || null,
      instructions: data.instructions?.trim() || null,
      added_by: data.addedById || null,
      sort_order: nextOrder,
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  if (data.photoIds?.length) {
    await supabase.from("recipe_photo_links").insert(
      data.photoIds.map((journalPhotoId) => ({
        recipe_id: recipe.id,
        journal_photo_id: journalPhotoId,
      }))
    );
  }

  revalidatePath("/dashboard/recipes");
  return recipe.id;
}

export async function updateRecipe(
  id: string,
  data: {
    title?: string;
    story?: string;
    taughtById?: string;
    occasions?: string;
    ingredients?: string;
    instructions?: string;
    addedById?: string;
    photoIds?: string[];
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const update: Record<string, unknown> = {};
  if (data.title !== undefined) update.title = data.title.trim();
  if (data.story !== undefined) update.story = data.story?.trim() || null;
  if (data.taughtById !== undefined) update.taught_by = data.taughtById || null;
  if (data.occasions !== undefined) update.occasions = data.occasions?.trim() || null;
  if (data.ingredients !== undefined) update.ingredients = data.ingredients?.trim() || null;
  if (data.instructions !== undefined) update.instructions = data.instructions?.trim() || null;
  if (data.addedById !== undefined) update.added_by = data.addedById || null;

  if (Object.keys(update).length > 0) {
    const { error } = await supabase.from("recipes").update(update).eq("id", id);
    if (error) throw error;
  }

  if (data.photoIds !== undefined) {
    await supabase.from("recipe_photo_links").delete().eq("recipe_id", id);
    if (data.photoIds.length > 0) {
      await supabase.from("recipe_photo_links").insert(
        data.photoIds.map((journalPhotoId) => ({
          recipe_id: id,
          journal_photo_id: journalPhotoId,
        }))
      );
    }
  }

  revalidatePath("/dashboard/recipes");
  revalidatePath(`/dashboard/recipes/${id}`);
}

export async function removeRecipe(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/recipes");
}
