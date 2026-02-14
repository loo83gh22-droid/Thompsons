"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { validateSchema } from "@/src/lib/validation/errors";
import { createStorySchema, updateStorySchema } from "./schemas";

export async function createStory(
  title: string,
  content: string,
  category: string,
  published: boolean,
  coverUrl?: string | null,
  authorFamilyMemberId?: string | null
) {
  // Validate input
  const validation = validateSchema(createStorySchema, {
    title,
    content,
    category,
    published,
    cover_url: coverUrl,
    author_family_member_id: authorFamilyMemberId,
  });

  if (!validation.success) {
    return { error: validation.error };
  }

  const input = validation.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { error: "No family" };

  const { data: myMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  const { data: row, error } = await supabase
    .from("family_stories")
    .insert({
      family_id: activeFamilyId,
      author_family_member_id: input.author_family_member_id || myMember?.id || null,
      created_by: myMember?.id || null,
      title: input.title,
      content: input.content,
      cover_url: input.cover_url,
      category: input.category,
      published: input.published,
    })
    .select("id")
    .single();
  if (error || !row) return { error: error?.message ?? "Failed to create story" };
  return { id: row.id };
}

export async function updateStory(
  id: string,
  updates: { title?: string; content?: string; category?: string; published?: boolean; cover_url?: string | null; author_family_member_id?: string | null }
) {
  // Validate updates
  const validation = validateSchema(updateStorySchema, updates);

  if (!validation.success) {
    return { error: validation.error };
  }

  const validatedUpdates = validation.data;

  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { error: "No family" };
  const { error } = await supabase
    .from("family_stories")
    .update({ ...validatedUpdates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("family_id", activeFamilyId);
  return { error: error?.message };
}

export async function deleteStory(id: string) {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { error: "No family" };
  const { error } = await supabase.from("family_stories").delete().eq("id", id).eq("family_id", activeFamilyId);
  return { error: error?.message };
}
