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

export async function updateEvent(
  eventId: string,
  data: { title: string; eventDate: string; description: string | null; recurring: string; category: string; inviteeIds: string[] }
) {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { error: "No family" };

  const { error: eventError } = await supabase
    .from("family_events")
    .update({
      title: data.title.trim().slice(0, 100),
      event_date: data.eventDate,
      description: data.description?.trim().slice(0, 500) || null,
      recurring: data.recurring || "none",
      category: data.category || "other",
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("family_id", activeFamilyId);
  if (eventError) return { error: eventError.message };

  await supabase.from("family_event_invitees").delete().eq("event_id", eventId);
  if (data.inviteeIds.length > 0) {
    await supabase.from("family_event_invitees").insert(
      data.inviteeIds.map((memberId) => ({ event_id: eventId, family_member_id: memberId }))
    );
  }
  return {};
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

/** Create birthday events for members with birth_date if not already present. Returns count added. */
export async function ensureBirthdayEvents(): Promise<{ added: number }> {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { added: 0 };

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name, birth_date")
    .eq("family_id", activeFamilyId)
    .not("birth_date", "is", null);
  if (!members?.length) return { added: 0 };

  const { data: existing } = await supabase
    .from("family_events")
    .select("id, created_by")
    .eq("family_id", activeFamilyId)
    .eq("category", "birthday");
  const existingMemberIds = new Set((existing ?? []).map((e) => e.created_by).filter(Boolean));

  const thisYear = new Date().getFullYear();
  let added = 0;
  for (const m of members) {
    const title = `${m.name}'s Birthday`;
    if (existingMemberIds.has(m.id)) continue;
    const d = String(m.birth_date);
    const eventDate = `${thisYear}-${d.slice(5, 7)}-${d.slice(8, 10)}`;
    const { error } = await supabase.from("family_events").insert({
      family_id: activeFamilyId,
      created_by: m.id,
      title,
      event_date: eventDate,
      category: "birthday",
      recurring: "annual",
    });
    if (!error) {
      added++;
      existingMemberIds.add(m.id);
    }
  }
  return { added };
}

/** Create a single birthday event for a member if one does not exist. Used when member birth_date is set/updated. */
export async function ensureBirthdayEventForMember(
  memberId: string,
  memberName: string,
  birthDate: string
): Promise<{ added: boolean }> {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { added: false };

  const title = `${memberName}'s Birthday`;
  const { data: existing } = await supabase
    .from("family_events")
    .select("id")
    .eq("family_id", activeFamilyId)
    .eq("category", "birthday")
    .eq("created_by", memberId)
    .limit(1)
    .maybeSingle();
  if (existing) return { added: false };

  const d = String(birthDate);
  const year = d.slice(0, 4);
  const month = d.slice(5, 7);
  const day = d.slice(8, 10);
  const thisYear = new Date().getFullYear();
  const eventDate = `${thisYear}-${month}-${day}`;

  const { error } = await supabase.from("family_events").insert({
    family_id: activeFamilyId,
    created_by: memberId,
    title,
    event_date: eventDate,
    category: "birthday",
    recurring: "annual",
  });
  if (error) return { added: false };
  return { added: true };
}
