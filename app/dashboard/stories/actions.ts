"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";

export async function createStory(
  title: string,
  content: string,
  category: string,
  published: boolean,
  coverUrl?: string | null,
  authorFamilyMemberId?: string | null
) {
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
      author_family_member_id: authorFamilyMemberId || myMember?.id || null,
      title,
      content,
      cover_url: coverUrl || null,
      category: category || "memorable_moments",
      published: !!published,
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
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { error: "No family" };
  const { error } = await supabase
    .from("family_stories")
    .update({ ...updates, updated_at: new Date().toISOString() })
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
