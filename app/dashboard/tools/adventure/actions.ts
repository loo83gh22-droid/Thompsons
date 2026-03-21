"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/src/lib/requireRole";
import { addStorageUsage, subtractStorageUsage, enforceStorageLimit } from "@/src/lib/plans";

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

export type AdventureVisit = {
  id: string;
  location_id: string;
  member_id: string;
  visited_date: string | null;
  notes: string | null;
  created_at: string;
};

export type AdventurePhoto = {
  id: string;
  location_id: string;
  storage_path: string;
  caption: string | null;
  uploaded_by: string | null;
  file_size_bytes: number | null;
  visit_id: string | null;
  created_at: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function ensureLocation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  familyId: string,
  featureSlug: string,
  locationName: string,
  memberId: string,
  latitude?: number | null,
  longitude?: number | null,
  description?: string | null,
): Promise<string> {
  const { data: existing } = await supabase
    .from("adventure_locations")
    .select("id")
    .eq("family_id", familyId)
    .eq("feature_slug", featureSlug)
    .eq("name", locationName)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("adventure_locations")
    .insert({
      family_id: familyId,
      feature_slug: featureSlug,
      name: locationName,
      description: description || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      visited: false,
      added_by: memberId,
    })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

async function syncVisitedFlag(
  supabase: Awaited<ReturnType<typeof createClient>>,
  locationId: string,
) {
  const { count } = await supabase
    .from("adventure_location_visits")
    .select("id", { count: "exact", head: true })
    .eq("location_id", locationId);

  const hasVisits = (count ?? 0) > 0;

  let latestDate: string | null = null;
  if (hasVisits) {
    const { data } = await supabase
      .from("adventure_location_visits")
      .select("visited_date")
      .eq("location_id", locationId)
      .not("visited_date", "is", null)
      .order("visited_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    latestDate = data?.visited_date ?? null;
  }

  await supabase
    .from("adventure_locations")
    .update({
      visited: hasVisits,
      visited_date: latestDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", locationId);
}

/* ------------------------------------------------------------------ */
/*  Add a visit (member + date + optional notes)                       */
/* ------------------------------------------------------------------ */

export async function addVisit(
  featureSlug: string,
  locationName: string,
  memberIds: string[],
  visitedDate: string,
  notes?: string,
  latitude?: number | null,
  longitude?: number | null,
  description?: string | null,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { familyId, memberId: currentMemberId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
    "teen",
  ]);

  const locationId = await ensureLocation(
    supabase, familyId, featureSlug, locationName,
    currentMemberId, latitude, longitude, description,
  );

  // Create one visit row per member
  const rows = memberIds.map((mid) => ({
    location_id: locationId,
    member_id: mid,
    visited_date: visitedDate || null,
    notes: notes?.trim() || null,
  }));

  const { error } = await supabase
    .from("adventure_location_visits")
    .insert(rows);
  if (error) throw error;

  await syncVisitedFlag(supabase, locationId);
  revalidatePath(`/dashboard/tools/${featureSlug}`);
}

/* ------------------------------------------------------------------ */
/*  Delete a visit                                                     */
/* ------------------------------------------------------------------ */

export async function deleteVisit(featureSlug: string, visitId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await requireRole(supabase, user.id, ["owner", "adult", "teen"]);

  // Get location_id before deleting
  const { data: visit } = await supabase
    .from("adventure_location_visits")
    .select("location_id")
    .eq("id", visitId)
    .single();

  // Delete associated photos from storage
  const { data: photos } = await supabase
    .from("adventure_location_photos")
    .select("id, storage_path, file_size_bytes")
    .eq("visit_id", visitId);

  if (photos?.length) {
    const { familyId } = await requireRole(supabase, user.id, ["owner", "adult", "teen"]);
    const paths = photos.map((p) => p.storage_path);
    await supabase.storage.from("adventure-locations").remove(paths);
    const totalBytes = photos.reduce((sum, p) => sum + (p.file_size_bytes || 0), 0);
    if (totalBytes > 0) await subtractStorageUsage(supabase, familyId, totalBytes);
  }

  const { error } = await supabase
    .from("adventure_location_visits")
    .delete()
    .eq("id", visitId);
  if (error) throw error;

  if (visit) await syncVisitedFlag(supabase, visit.location_id);
  revalidatePath(`/dashboard/tools/${featureSlug}`);
}

/* ------------------------------------------------------------------ */
/*  Update a visit (date + notes)                                      */
/* ------------------------------------------------------------------ */

export async function updateVisit(
  featureSlug: string,
  visitId: string,
  visitedDate: string,
  notes: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await requireRole(supabase, user.id, ["owner", "adult", "teen"]);

  const { error } = await supabase
    .from("adventure_location_visits")
    .update({ visited_date: visitedDate || null, notes: notes.trim() || null })
    .eq("id", visitId);
  if (error) throw error;

  // Re-sync the location's visited_date to the latest visit
  const { data: visit } = await supabase
    .from("adventure_location_visits")
    .select("location_id")
    .eq("id", visitId)
    .single();
  if (visit) await syncVisitedFlag(supabase, visit.location_id);

  revalidatePath(`/dashboard/tools/${featureSlug}`);
}

/* ------------------------------------------------------------------ */
/*  Legacy toggle (whole-family visited)                                */
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

  const { data: photos } = await supabase
    .from("adventure_location_photos")
    .select("storage_path, file_size_bytes")
    .eq("location_id", locationId);

  if (photos?.length) {
    const paths = photos.map((p) => p.storage_path);
    await supabase.storage.from("adventure-locations").remove(paths);
    const totalBytes = photos.reduce((sum, p) => sum + (p.file_size_bytes || 0), 0);
    if (totalBytes > 0) await subtractStorageUsage(supabase, familyId, totalBytes);
  }

  const { error } = await supabase
    .from("adventure_locations")
    .delete()
    .eq("id", locationId)
    .eq("family_id", familyId)
    .eq("feature_slug", featureSlug);

  if (error) throw error;
  revalidatePath(`/dashboard/tools/${featureSlug}`);
}

/* ------------------------------------------------------------------ */
/*  Upload photo to a location                                         */
/* ------------------------------------------------------------------ */

export async function uploadLocationPhoto(
  featureSlug: string,
  locationName: string,
  formData: FormData,
  latitude?: number | null,
  longitude?: number | null,
  description?: string | null,
  visitId?: string | null,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { familyId, memberId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
    "teen",
  ]);

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");

  await enforceStorageLimit(supabase, familyId, file.size);

  const locationId = await ensureLocation(
    supabase, familyId, featureSlug, locationName,
    memberId, latitude, longitude, description,
  );

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${locationId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("adventure-locations")
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  await addStorageUsage(supabase, familyId, file.size);

  const caption = (formData.get("caption") as string)?.trim() || null;

  const { error: dbError } = await supabase
    .from("adventure_location_photos")
    .insert({
      location_id: locationId,
      storage_path: path,
      caption,
      uploaded_by: memberId,
      file_size_bytes: file.size,
      visit_id: visitId || null,
    });

  if (dbError) {
    await supabase.storage.from("adventure-locations").remove([path]);
    await subtractStorageUsage(supabase, familyId, file.size);
    throw dbError;
  }

  revalidatePath(`/dashboard/tools/${featureSlug}`);
}

/* ------------------------------------------------------------------ */
/*  Delete a photo                                                     */
/* ------------------------------------------------------------------ */

export async function deleteLocationPhoto(featureSlug: string, photoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { familyId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
    "teen",
  ]);

  const { data: photo } = await supabase
    .from("adventure_location_photos")
    .select("storage_path, file_size_bytes, location_id")
    .eq("id", photoId)
    .single();

  if (!photo) throw new Error("Photo not found");

  const { data: loc } = await supabase
    .from("adventure_locations")
    .select("family_id")
    .eq("id", photo.location_id)
    .single();

  if (!loc || loc.family_id !== familyId) throw new Error("Not authorized");

  await supabase.storage.from("adventure-locations").remove([photo.storage_path]);
  if (photo.file_size_bytes) {
    await subtractStorageUsage(supabase, familyId, photo.file_size_bytes);
  }

  const { error } = await supabase
    .from("adventure_location_photos")
    .delete()
    .eq("id", photoId);
  if (error) throw error;

  revalidatePath(`/dashboard/tools/${featureSlug}`);
}
