"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import type { SupabaseClient } from "@supabase/supabase-js";

type Result = { success: boolean; error?: string };

/** Create or update an annual birthday event for a contact. Uses title-based dedup
 *  (created_by IS NULL distinguishes contact events from member birthday events). */
async function syncContactBirthdayEvent(
  supabase: SupabaseClient,
  familyId: string,
  contactName: string,
  birthday: string | null,
  oldName?: string
) {
  const title = `${contactName}'s Birthday`;
  const oldTitle = oldName ? `${oldName}'s Birthday` : null;

  // Delete old birthday event when the contact was renamed
  if (oldTitle && oldTitle !== title) {
    await supabase
      .from("family_events")
      .delete()
      .eq("family_id", familyId)
      .eq("category", "birthday")
      .eq("title", oldTitle)
      .is("created_by", null);
  }

  // If birthday cleared, remove the event
  if (!birthday) {
    await supabase
      .from("family_events")
      .delete()
      .eq("family_id", familyId)
      .eq("category", "birthday")
      .eq("title", title)
      .is("created_by", null);
    return;
  }

  // Check if a birthday event already exists for this contact
  const { data: existing } = await supabase
    .from("family_events")
    .select("id")
    .eq("family_id", familyId)
    .eq("category", "birthday")
    .eq("title", title)
    .is("created_by", null)
    .limit(1)
    .maybeSingle();

  const thisYear = new Date().getFullYear();
  const d = String(birthday);
  const eventDate = `${thisYear}-${d.slice(5, 7)}-${d.slice(8, 10)}`;

  if (existing) {
    await supabase
      .from("family_events")
      .update({ event_date: eventDate })
      .eq("id", existing.id);
  } else {
    await supabase.from("family_events").insert({
      family_id: familyId,
      created_by: null,
      title,
      event_date: eventDate,
      category: "birthday",
      recurring: "annual",
    });
  }
}

export async function addContact(
  name: string,
  email: string,
  relationship: string,
  notes: string,
  birthday: string
): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };
    if (!name.trim()) return { success: false, error: "Name is required" };

    const { error } = await supabase.from("family_contacts").insert({
      family_id: activeFamilyId,
      name: name.trim(),
      email: email.trim() || null,
      relationship: relationship.trim() || null,
      notes: notes.trim() || null,
      birthday: birthday || null,
    });
    if (error) return { success: false, error: error.message };

    await syncContactBirthdayEvent(supabase, activeFamilyId, name.trim(), birthday || null);

    revalidatePath("/dashboard/contacts");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/events");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function updateContact(
  id: string,
  name: string,
  email: string,
  relationship: string,
  notes: string,
  birthday: string,
  oldName?: string
): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("family_contacts")
      .update({
        name: name.trim(),
        email: email.trim() || null,
        relationship: relationship.trim() || null,
        notes: notes.trim() || null,
        birthday: birthday || null,
      })
      .eq("id", id)
      .eq("family_id", activeFamilyId);
    if (error) return { success: false, error: error.message };

    await syncContactBirthdayEvent(supabase, activeFamilyId, name.trim(), birthday || null, oldName);

    revalidatePath("/dashboard/contacts");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/events");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function deleteContact(id: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    // Fetch the contact name first so we can clean up the birthday event
    const { data: contact } = await supabase
      .from("family_contacts")
      .select("name")
      .eq("id", id)
      .eq("family_id", activeFamilyId)
      .maybeSingle();

    const { error } = await supabase
      .from("family_contacts")
      .delete()
      .eq("id", id)
      .eq("family_id", activeFamilyId);
    if (error) return { success: false, error: error.message };

    // Remove the birthday event if one existed
    if (contact?.name) {
      await supabase
        .from("family_events")
        .delete()
        .eq("family_id", activeFamilyId)
        .eq("category", "birthday")
        .eq("title", `${contact.name}'s Birthday`)
        .is("created_by", null);
    }

    revalidatePath("/dashboard/contacts");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/events");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}
