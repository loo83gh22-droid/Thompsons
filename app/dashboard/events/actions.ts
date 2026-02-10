"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";

export async function createEvent(
  title: string,
  eventDate: string,
  description: string | null,
  recurring: string,
  category: string,
  inviteeIds: string[]
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
  if (!myMember) return { error: "Family member not found" };

  const { data: event, error: eventError } = await supabase
    .from("family_events")
    .insert({
      family_id: activeFamilyId,
      created_by: myMember.id,
      title,
      event_date: eventDate,
      description: description || null,
      recurring: recurring || "none",
      category: category || "other",
    })
    .select("id")
    .single();
  if (eventError || !event) return { error: eventError?.message ?? "Failed to create event" };

  if (inviteeIds.length > 0) {
    await supabase.from("family_event_invitees").insert(
      inviteeIds.map((memberId) => ({ event_id: event.id, family_member_id: memberId }))
    );
  }
  return { id: event.id };
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { error: "No family" };
  const { error } = await supabase
    .from("family_events")
    .delete()
    .eq("id", eventId)
    .eq("family_id", activeFamilyId);
  return { error: error?.message };
}
