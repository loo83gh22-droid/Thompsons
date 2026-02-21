"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { validateSchema } from "@/src/lib/validation/errors";
import { createStorySchema, updateStorySchema } from "./schemas";
import { getFamilyPlan, checkFeatureLimit } from "@/src/lib/plans";

export async function createStory(
  title: string,
  content: string,
  category: string,
  published: boolean,
  coverUrl?: string | null,
  authorFamilyMemberId?: string | null,
  memberIds?: string[]
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

  // Enforce story limit
  const plan = await getFamilyPlan(supabase, activeFamilyId);
  const limitError = await checkFeatureLimit(supabase, activeFamilyId, plan.planType, "stories", "family_stories");
  if (limitError) return { error: limitError };

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

  // Insert junction table rows for all selected members
  const ids = memberIds?.filter(Boolean) ?? [];
  if (ids.length > 0) {
    await supabase.from("family_story_members").insert(
      ids.map((memberId) => ({ story_id: row.id, family_member_id: memberId }))
    );
  }

  return { id: row.id };
}

export async function updateStory(
  id: string,
  updates: { title?: string; content?: string; category?: string; published?: boolean; cover_url?: string | null; author_family_member_id?: string | null },
  memberIds?: string[]
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

  // Sync junction table
  if (memberIds) {
    await supabase.from("family_story_members").delete().eq("story_id", id);
    const ids = memberIds.filter(Boolean);
    if (ids.length > 0) {
      await supabase.from("family_story_members").insert(
        ids.map((memberId) => ({ story_id: id, family_member_id: memberId }))
      );
    }
  }

  return { error: error?.message };
}

export async function deleteStory(id: string) {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { error: "No family" };
  const { error } = await supabase.from("family_stories").delete().eq("id", id).eq("family_id", activeFamilyId);
  return { error: error?.message };
}
