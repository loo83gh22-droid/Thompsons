"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { validateSchema } from "@/src/lib/validation/errors";
import { createRecipeSchema } from "./schemas";
import { getFamilyPlan, checkFeatureLimit } from "@/src/lib/plans";

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
  // Validate input
  const validation = validateSchema(createRecipeSchema, {
    title: data.title,
    story: data.story,
    taught_by_id: data.taughtById,
    occasions: data.occasions,
    ingredients: data.ingredients,
    instructions: data.instructions,
    added_by_id: data.addedById,
    photo_ids: data.photoIds || [],
  });

  if (!validation.success) {
    throw new Error(validation.error);
  }

  const input = validation.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Enforce recipe limit
  const plan = await getFamilyPlan(supabase, activeFamilyId);
  const limitError = await checkFeatureLimit(supabase, activeFamilyId, plan.planType, "recipes", "recipes");
  if (limitError) throw new Error(limitError);

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
      title: input.title,
      story: input.story,
      taught_by: input.taught_by_id,
      occasions: input.occasions,
      ingredients: input.ingredients,
      instructions: input.instructions,
      added_by: input.added_by_id,
      sort_order: nextOrder,
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  if (input.photo_ids?.length) {
    await supabase.from("recipe_photo_links").insert(
      input.photo_ids.map((journalPhotoId) => ({
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
  // Validate partial update
  const validation = validateSchema(createRecipeSchema.partial(), {
    title: data.title,
    story: data.story,
    taught_by_id: data.taughtById,
    occasions: data.occasions,
    ingredients: data.ingredients,
    instructions: data.instructions,
    added_by_id: data.addedById,
    photo_ids: data.photoIds,
  });

  if (!validation.success) {
    throw new Error(validation.error);
  }

  const input = validation.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const update: Record<string, unknown> = {};
  if (input.title !== undefined) update.title = input.title;
  if (input.story !== undefined) update.story = input.story;
  if (input.taught_by_id !== undefined) update.taught_by = input.taught_by_id;
  if (input.occasions !== undefined) update.occasions = input.occasions;
  if (input.ingredients !== undefined) update.ingredients = input.ingredients;
  if (input.instructions !== undefined) update.instructions = input.instructions;
  if (input.added_by_id !== undefined) update.added_by = input.added_by_id;

  if (Object.keys(update).length > 0) {
    const { error } = await supabase.from("recipes").update(update).eq("id", id);
    if (error) throw error;
  }

  if (input.photo_ids !== undefined) {
    await supabase.from("recipe_photo_links").delete().eq("recipe_id", id);
    if (input.photo_ids.length > 0) {
      await supabase.from("recipe_photo_links").insert(
        input.photo_ids.map((journalPhotoId) => ({
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
