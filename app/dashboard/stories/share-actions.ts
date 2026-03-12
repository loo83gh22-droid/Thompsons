"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function toggleStoryShare(storyId: string): Promise<{ shareToken: string | null; isPublic: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: story } = await supabase
    .from("family_stories")
    .select("id, is_public, share_token")
    .eq("id", storyId)
    .single();

  if (!story) throw new Error("Story not found");

  if (story.is_public) {
    // Unshare
    await supabase
      .from("family_stories")
      .update({ is_public: false, share_token: null })
      .eq("id", storyId);

    revalidatePath("/dashboard/stories");
    return { shareToken: null, isPublic: false };
  } else {
    // Share — generate token
    const token = crypto.randomBytes(16).toString("hex");
    await supabase
      .from("family_stories")
      .update({ is_public: true, share_token: token })
      .eq("id", storyId);

    revalidatePath("/dashboard/stories");
    return { shareToken: token, isPublic: true };
  }
}

export async function toggleRecipeShare(recipeId: string): Promise<{ shareToken: string | null; isPublic: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id, is_public, share_token")
    .eq("id", recipeId)
    .single();

  if (!recipe) throw new Error("Recipe not found");

  if (recipe.is_public) {
    await supabase
      .from("recipes")
      .update({ is_public: false, share_token: null })
      .eq("id", recipeId);

    revalidatePath("/dashboard/recipes");
    return { shareToken: null, isPublic: false };
  } else {
    const token = crypto.randomBytes(16).toString("hex");
    await supabase
      .from("recipes")
      .update({ is_public: true, share_token: token })
      .eq("id", recipeId);

    revalidatePath("/dashboard/recipes");
    return { shareToken: token, isPublic: true };
  }
}
