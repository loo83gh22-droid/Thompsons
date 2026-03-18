"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/src/lib/requireRole";

const PAGE_PATH = "/dashboard/tools/emergency-info";

// ─── Emergency Contacts ───

export async function addEmergencyContact(data: {
  contact_name: string;
  relationship?: string;
  phone?: string;
  email?: string;
  is_primary?: boolean;
  member_id?: string | null;
  notes?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { familyId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
  ]);

  // Get next sort_order
  const { data: last } = await supabase
    .from("emergency_contacts")
    .select("sort_order")
    .eq("family_id", familyId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;

  // If marking as primary, unset existing primary
  if (data.is_primary) {
    await supabase
      .from("emergency_contacts")
      .update({ is_primary: false })
      .eq("family_id", familyId)
      .eq("is_primary", true);
  }

  const { error } = await supabase.from("emergency_contacts").insert({
    family_id: familyId,
    contact_name: data.contact_name.trim(),
    relationship: data.relationship?.trim() || null,
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    is_primary: data.is_primary ?? false,
    member_id: data.member_id || null,
    notes: data.notes?.trim() || null,
    sort_order: nextOrder,
  });

  if (error) throw error;
  revalidatePath(PAGE_PATH);
}

export async function updateEmergencyContact(
  id: string,
  data: {
    contact_name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
    is_primary?: boolean;
    member_id?: string | null;
    notes?: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { familyId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
  ]);

  // If marking as primary, unset existing primary
  if (data.is_primary) {
    await supabase
      .from("emergency_contacts")
      .update({ is_primary: false })
      .eq("family_id", familyId)
      .eq("is_primary", true);
  }

  const updates: Record<string, unknown> = {};
  if (data.contact_name !== undefined)
    updates.contact_name = data.contact_name.trim();
  if (data.relationship !== undefined)
    updates.relationship = data.relationship.trim() || null;
  if (data.phone !== undefined) updates.phone = data.phone.trim() || null;
  if (data.email !== undefined) updates.email = data.email.trim() || null;
  if (data.is_primary !== undefined) updates.is_primary = data.is_primary;
  if (data.member_id !== undefined)
    updates.member_id = data.member_id || null;
  if (data.notes !== undefined) updates.notes = data.notes.trim() || null;

  const { error } = await supabase
    .from("emergency_contacts")
    .update(updates)
    .eq("id", id)
    .eq("family_id", familyId);

  if (error) throw error;
  revalidatePath(PAGE_PATH);
}

export async function deleteEmergencyContact(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { familyId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
  ]);

  const { error } = await supabase
    .from("emergency_contacts")
    .delete()
    .eq("id", id)
    .eq("family_id", familyId);

  if (error) throw error;
  revalidatePath(PAGE_PATH);
}

// ─── Medical Info ───

export async function upsertMedicalInfo(data: {
  member_id: string;
  blood_type?: string;
  allergies?: string;
  medications?: string;
  conditions?: string;
  doctor_name?: string;
  doctor_phone?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { familyId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
  ]);

  const row = {
    family_id: familyId,
    member_id: data.member_id,
    blood_type: data.blood_type?.trim() || null,
    allergies: data.allergies?.trim() || null,
    medications: data.medications?.trim() || null,
    conditions: data.conditions?.trim() || null,
    doctor_name: data.doctor_name?.trim() || null,
    doctor_phone: data.doctor_phone?.trim() || null,
    insurance_provider: data.insurance_provider?.trim() || null,
    insurance_policy_number: data.insurance_policy_number?.trim() || null,
    notes: data.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  // Try update first, then insert if no row exists
  const { data: existing } = await supabase
    .from("medical_info")
    .select("id")
    .eq("family_id", familyId)
    .eq("member_id", data.member_id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("medical_info")
      .update(row)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("medical_info").insert(row);
    if (error) throw error;
  }

  revalidatePath(PAGE_PATH);
}
