"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export type ReunionStatus = "planning" | "confirmed" | "completed" | "cancelled";
export type RsvpStatus = "attending" | "maybe" | "declined" | "pending";

export async function createReunion(data: {
  title: string;
  description?: string;
  locationName?: string;
  startDate: string;
  endDate?: string;
  createdBy: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { error } = await supabase.from("reunions").insert({
    family_id: activeFamilyId,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    location_name: data.locationName?.trim() || null,
    start_date: data.startDate,
    end_date: data.endDate || null,
    created_by: data.createdBy,
  });

  if (error) throw error;
  revalidatePath("/dashboard/tools/reunion-planner");
}

export async function updateReunion(
  id: string,
  data: {
    title?: string;
    description?: string;
    locationName?: string;
    startDate?: string;
    endDate?: string | null;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.description !== undefined) updates.description = data.description?.trim() || null;
  if (data.locationName !== undefined) updates.location_name = data.locationName?.trim() || null;
  if (data.startDate !== undefined) updates.start_date = data.startDate;
  if (data.endDate !== undefined) updates.end_date = data.endDate || null;

  const { error } = await supabase
    .from("reunions")
    .update(updates)
    .eq("id", id)
    .eq("family_id", activeFamilyId);

  if (error) throw error;
  revalidatePath("/dashboard/tools/reunion-planner");
  revalidatePath(`/dashboard/tools/reunion-planner/${id}`);
}

export async function updateReunionStatus(id: string, status: ReunionStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { error } = await supabase
    .from("reunions")
    .update({ status })
    .eq("id", id)
    .eq("family_id", activeFamilyId);

  if (error) throw error;
  revalidatePath("/dashboard/tools/reunion-planner");
  revalidatePath(`/dashboard/tools/reunion-planner/${id}`);
}

export async function deleteReunion(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { error } = await supabase
    .from("reunions")
    .delete()
    .eq("id", id)
    .eq("family_id", activeFamilyId);

  if (error) throw error;
  revalidatePath("/dashboard/tools/reunion-planner");
}

export async function upsertRsvp(
  reunionId: string,
  data: {
    memberId: string;
    status: RsvpStatus;
    plusOnes?: number;
    dietaryNotes?: string;
    notes?: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("reunion_rsvps").upsert(
    {
      reunion_id: reunionId,
      member_id: data.memberId,
      status: data.status,
      plus_ones: data.plusOnes ?? 0,
      dietary_notes: data.dietaryNotes?.trim() || null,
      notes: data.notes?.trim() || null,
      responded_at: new Date().toISOString(),
    },
    { onConflict: "reunion_id,member_id" }
  );

  if (error) throw error;
  revalidatePath(`/dashboard/tools/reunion-planner/${reunionId}`);
  revalidatePath("/dashboard/tools/reunion-planner");
}
