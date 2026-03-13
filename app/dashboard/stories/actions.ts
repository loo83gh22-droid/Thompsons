"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { validateSchema } from "@/src/lib/validation/errors";
import { createStorySchema, updateStorySchema } from "./schemas";
import { getFamilyPlan, checkFeatureLimit, enforceStorageLimit, addStorageUsage, subtractStorageUsage } from "@/src/lib/plans";

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
    const { error: junctionErr } = await supabase.from("family_story_members").insert(
      ids.map((memberId) => ({ story_id: row.id, family_member_id: memberId }))
    );
    if (junctionErr) console.error("[createStory] family_story_members insert failed:", junctionErr.message);
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

  // Clean up cover image from storage before deleting (W17)
  const { data: story } = await supabase
    .from("family_stories")
    .select("cover_url")
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  if (story?.cover_url) {
    const match = story.cover_url.match(/\/api\/storage\/story-covers\/(.+)$/);
    if (match) {
      const storagePath = match[1];
      // Get file size for counter decrement
      const parts = storagePath.split("/");
      const dir = parts.slice(0, -1).join("/");
      const fileName = parts[parts.length - 1];
      const { data: fileList } = await supabase.storage
        .from("story-covers")
        .list(dir, { search: fileName });
      const fileSize = fileList?.[0]?.metadata?.size ?? 0;

      await supabase.storage.from("story-covers").remove([storagePath]);

      if (fileSize > 0) {
        await subtractStorageUsage(supabase, activeFamilyId, fileSize);
      }
    }
  }

  const { error } = await supabase.from("family_stories").delete().eq("id", id).eq("family_id", activeFamilyId);
  return { error: error?.message };
}

export async function addStoryPerspective(storyId: string, content: string, familyMemberId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("story_perspectives").insert({
    story_id: storyId,
    family_member_id: familyMemberId,
    content: content.trim(),
  });
  if (error) throw new Error(error.message);
}

export async function removeStoryPerspective(perspectiveId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("story_perspectives").delete().eq("id", perspectiveId);
  if (error) throw new Error(error.message);
}

/** Upload a story cover image with storage enforcement (G16) */
export async function uploadStoryCover(formData: FormData): Promise<{ url: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const file = formData.get("file") as File | null;
  if (!file || !file.type.startsWith("image/")) throw new Error("Invalid image file");

  await enforceStorageLimit(supabase, activeFamilyId, file.size);

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("story-covers")
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  await addStorageUsage(supabase, activeFamilyId, file.size);

  return { url: `/api/storage/story-covers/${path}` };
}
