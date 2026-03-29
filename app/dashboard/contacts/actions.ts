"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

type Result = { success: boolean; error?: string };

export async function addContact(
  name: string,
  email: string,
  relationship: string,
  notes: string
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
    });
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/contacts");
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
  notes: string
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
      })
      .eq("id", id)
      .eq("family_id", activeFamilyId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/contacts");
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

    const { error } = await supabase
      .from("family_contacts")
      .delete()
      .eq("id", id)
      .eq("family_id", activeFamilyId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/contacts");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}
