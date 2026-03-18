"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/src/lib/requireRole";

export type AdventureLocation = {
  id: string;
  family_id: string;
  feature_slug: string;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  visited: boolean;
  visited_date: string | null;
  rating: number | null;
  notes: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
};

/* ------------------------------------------------------------------ */
/*  Toggle visited status                                              */
/* ------------------------------------------------------------------ */

export async function toggleVisited(
  featureSlug: string,
  locationName: string,
  visited: boolean,
  latitude?: number | null,
  longitude?: number | null,
  description?: string | null,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { familyId, memberId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
    "teen",
  ]);

  // Check if location already exists for this family + feature
  const { data: existing } = await supabase
    .from("adventure_locations")
    .select("id")
    .eq("family_id", familyId)
    .eq("feature_slug", featureSlug)
    .eq("name", locationName)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("adventure_locations")
      .update({
        visited,
        visited_date: visited ? new Date().toISOString().split("T")[0] : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("adventure_locations").insert({
      family_id: familyId,
      feature_slug: featureSlug,
      name: locationName,
      description: description || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      visited,
      visited_date: visited ? new Date().toISOString().split("T")[0] : null,
      added_by: memberId,
    });
    if (error) throw error;
  }

  revalidatePath(`/dashboard/tools/${featureSlug}`);
}

/* ------------------------------------------------------------------ */
/*  Update rating                                                      */
/* ------------------------------------------------------------------ */

export async function updateRating(
  featureSlug: string,
  locationName: string,
  rating: number,
  latitude?: number | null,
  longitude?: number | null,
  description?: string | null,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { familyId, memberId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
    "teen",
  ]);

  const { data: existing } = await supabase
    .from("adventure_locations")
    .select("id")
    .eq("family_id", familyId)
    .eq("feature_slug", featureSlug)
    .eq("name", locationName)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("adventure_locations")
      .update({ rating, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("adventure_locations").insert({
      family_id: familyId,
      feature_slug: featureSlug,
      name: locationName,
      description: description || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      visited: true,
      visited_date: new Date().toISOString().split("T")[0],
      rating,
      added_by: memberId,
    });
    if (error) throw error;
  }

  revalidatePath(`/dashboard/tools/${featureSlug}`);
}

/* ------------------------------------------------------------------ */
/*  Update notes                                                       */
/* ------------------------------------------------------------------ */

export async function updateNotes(
  featureSlug: string,
  locationName: string,
  notes: string,
  latitude?: number | null,
  longitude?: number | null,
  description?: string | null,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { familyId, memberId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
    "teen",
  ]);

  const { data: existing } = await supabase
    .from("adventure_locations")
    .select("id")
    .eq("family_id", familyId)
    .eq("feature_slug", featureSlug)
    .eq("name", locationName)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("adventure_locations")
      .update({ notes: notes || null, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("adventure_locations").insert({
      family_id: familyId,
      feature_slug: featureSlug,
      name: locationName,
      description: description || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      visited: false,
      notes: notes || null,
      added_by: memberId,
    });
    if (error) throw error;
  }

  revalidatePath(`/dashboard/tools/${featureSlug}`);
}

/* ------------------------------------------------------------------ */
/*  Add custom location                                                */
/* ------------------------------------------------------------------ */

export async function addCustomLocation(
  featureSlug: string,
  data: {
    name: string;
    description?: string;
    latitude?: number;
    longitude?: number;
  },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { familyId, memberId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
    "teen",
  ]);

  // Check for duplicate name
  const { data: existing } = await supabase
    .from("adventure_locations")
    .select("id")
    .eq("family_id", familyId)
    .eq("feature_slug", featureSlug)
    .eq("name", data.name.trim())
    .maybeSingle();

  if (existing) throw new Error("A location with that name already exists");

  const { error } = await supabase.from("adventure_locations").insert({
    family_id: familyId,
    feature_slug: featureSlug,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    visited: false,
    added_by: memberId,
  });

  if (error) throw error;
  revalidatePath(`/dashboard/tools/${featureSlug}`);
}

/* ------------------------------------------------------------------ */
/*  Delete custom location                                             */
/* ------------------------------------------------------------------ */

export async function deleteLocation(featureSlug: string, locationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { familyId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
    "teen",
  ]);

  const { error } = await supabase
    .from("adventure_locations")
    .delete()
    .eq("id", locationId)
    .eq("family_id", familyId)
    .eq("feature_slug", featureSlug);

  if (error) throw error;
  revalidatePath(`/dashboard/tools/${featureSlug}`);
}
