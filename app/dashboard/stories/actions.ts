"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export async function createStoryEvent(data: {
  title: string;
  eventDate?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { data: myMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!myMember) throw new Error("No family member found");

  const { data: last } = await supabase
    .from("story_events")
    .select("sort_order")
    .eq("family_id", activeFamilyId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;

  const { data: event, error } = await supabase
    .from("story_events")
    .insert({
      family_id: activeFamilyId,
      title: data.title.trim(),
      event_date: data.eventDate || null,
      created_by: myMember.id,
      sort_order: nextOrder,
    })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/stories");
  return event.id;
}

export async function addPerspective(
  storyEventId: string,
  content: string,
  familyMemberId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("story_perspectives").insert({
    story_event_id: storyEventId,
    family_member_id: familyMemberId,
    content: content.trim(),
  });

  if (error) throw error;
  revalidatePath("/dashboard/stories");
  revalidatePath(`/dashboard/stories/${storyEventId}`);
}

export async function updatePerspective(id: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("story_perspectives")
    .update({ content: content.trim() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/stories");
}

export async function removeStoryEvent(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("story_events").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/stories");
}

export async function removePerspective(id: string, storyEventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("story_perspectives").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/stories");
  revalidatePath(`/dashboard/stories/${storyEventId}`);
}
