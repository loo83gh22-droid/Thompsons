"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/src/lib/requireRole";

export type TripStatus = "planning" | "booked" | "in_progress" | "completed";

const PACKING_CATEGORIES = ["Clothes", "Toiletries", "Electronics", "Documents", "Other"] as const;
export type PackingCategory = (typeof PACKING_CATEGORIES)[number];

// ── Trips ──────────────────────────────────────────────────────────────

export async function createTrip(data: {
  name: string;
  description?: string;
  destination?: string;
  startDate: string;
  endDate?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { familyId, memberId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
  ]);

  const { error } = await supabase.from("trips").insert({
    family_id: familyId,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    destination: data.destination?.trim() || null,
    start_date: data.startDate,
    end_date: data.endDate || null,
    status: "planning",
    created_by: memberId,
  });

  if (error) throw error;
  revalidatePath("/dashboard/tools/trip-planner");
}

export async function updateTripStatus(id: string, status: TripStatus) {
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
    .from("trips")
    .update({ status })
    .eq("id", id)
    .eq("family_id", familyId);

  if (error) throw error;
  revalidatePath("/dashboard/tools/trip-planner");
  revalidatePath(`/dashboard/tools/trip-planner/${id}`);
}

export async function deleteTrip(id: string) {
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
    .from("trips")
    .delete()
    .eq("id", id)
    .eq("family_id", familyId);

  if (error) throw error;
  revalidatePath("/dashboard/tools/trip-planner");
}

// ── Itinerary Items ────────────────────────────────────────────────────

export async function addItineraryItem(data: {
  tripId: string;
  dayDate: string;
  title: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await requireRole(supabase, user.id, ["owner", "adult"]);

  // Get next sort order
  const { data: existing } = await supabase
    .from("trip_itinerary_items")
    .select("sort_order")
    .eq("trip_id", data.tripId)
    .eq("day_date", data.dayDate)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing?.length ? (existing[0].sort_order ?? 0) + 1 : 0;

  const { error } = await supabase.from("trip_itinerary_items").insert({
    trip_id: data.tripId,
    day_date: data.dayDate,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    location: data.location?.trim() || null,
    start_time: data.startTime || null,
    end_time: data.endTime || null,
    sort_order: nextOrder,
  });

  if (error) throw error;
  revalidatePath(`/dashboard/tools/trip-planner/${data.tripId}`);
}

export async function deleteItineraryItem(tripId: string, itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await requireRole(supabase, user.id, ["owner", "adult"]);

  const { error } = await supabase
    .from("trip_itinerary_items")
    .delete()
    .eq("id", itemId)
    .eq("trip_id", tripId);

  if (error) throw error;
  revalidatePath(`/dashboard/tools/trip-planner/${tripId}`);
}

// ── Packing Items ──────────────────────────────────────────────────────

export async function addPackingItem(data: {
  tripId: string;
  itemName: string;
  category: string;
  assignedTo?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await requireRole(supabase, user.id, ["owner", "adult", "teen"]);

  const { error } = await supabase.from("trip_packing_items").insert({
    trip_id: data.tripId,
    item_name: data.itemName.trim(),
    category: data.category,
    assigned_to: data.assignedTo || null,
    is_packed: false,
  });

  if (error) throw error;
  revalidatePath(`/dashboard/tools/trip-planner/${data.tripId}`);
}

export async function togglePackingItem(
  tripId: string,
  itemId: string,
  isPacked: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await requireRole(supabase, user.id, ["owner", "adult", "teen"]);

  const { error } = await supabase
    .from("trip_packing_items")
    .update({ is_packed: isPacked })
    .eq("id", itemId)
    .eq("trip_id", tripId);

  if (error) throw error;
  revalidatePath(`/dashboard/tools/trip-planner/${tripId}`);
}

export async function deletePackingItem(tripId: string, itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await requireRole(supabase, user.id, ["owner", "adult"]);

  const { error } = await supabase
    .from("trip_packing_items")
    .delete()
    .eq("id", itemId)
    .eq("trip_id", tripId);

  if (error) throw error;
  revalidatePath(`/dashboard/tools/trip-planner/${tripId}`);
}
