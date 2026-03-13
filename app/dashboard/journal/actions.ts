"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { findOrCreateLocationCluster } from "@/src/lib/locationClustering";
import { getFamilyPlan, checkFeatureLimit, videosPerEntryLimit, enforceStorageLimit, addStorageUsage, subtractStorageUsage } from "@/src/lib/plans";
import { VIDEO_LIMITS } from "@/src/lib/constants";
import { getFormString } from "@/src/lib/validation/schemas";
import { validateSchema } from "@/src/lib/validation/errors";
import { createJournalEntrySchema } from "./schemas";

export type CreateJournalResult = { success: true; id: string } | { success: false; error: string };

export async function createJournalEntry(formData: FormData): Promise<CreateJournalResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    // Enforce journal entry limit for the family's plan
    const plan = await getFamilyPlan(supabase, activeFamilyId);
    const limitError = await checkFeatureLimit(supabase, activeFamilyId, plan.planType, "journalEntries", "journal_entries");
    if (limitError) return { success: false, error: limitError };

    // Extract and validate FormData — deduplicate in case client sends IDs twice
    const memberIds = [...new Set(formData.getAll("member_ids").map(String).filter(Boolean))];
    const rawData = {
      family_member_id: memberIds[0] || null,
      member_ids: memberIds,
      title: getFormString(formData, "title"),
      content: getFormString(formData, "content"),
      location: getFormString(formData, "location"),
      trip_date: getFormString(formData, "trip_date"),
      trip_date_end: getFormString(formData, "trip_date_end"),
      location_lat: getFormString(formData, "location_lat"),
      location_lng: getFormString(formData, "location_lng"),
      location_type: getFormString(formData, "location_type"),
    };

    const validation = validateSchema(createJournalEntrySchema, rawData);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const input = validation.data;

    // Get the logged-in user's family_member record for created_by + role check
    const { data: myMember } = await supabase
      .from("family_members")
      .select("id, role")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single();

    // author_override lets a user attribute the entry to another family member
    // (e.g., writing on behalf of a grandparent who doesn't have an account).
    // Only owners and adults may use this — prevent teens from impersonating others.
    const authorOverrideId = getFormString(formData, "author_override") || null;
    if (authorOverrideId) {
      const role = myMember?.role;
      if (role !== "owner" && role !== "adult") {
        return { success: false, error: "Only owners and adults can attribute entries to other family members." };
      }
    }
    const authorId = authorOverrideId || myMember?.id || input.member_ids[0];

    const idempotencyKey = getFormString(formData, "idempotency_key") || null;

    const { data: entry, error: entryError } = await supabase
      .from("journal_entries")
      .insert({
        family_id: activeFamilyId,
        author_id: authorId,
        created_by: myMember?.id || null,
        title: input.title,
        content: input.content,
        location: input.location,
        trip_date: input.trip_date,
        trip_date_end: input.trip_date_end,
        idempotency_key: idempotencyKey,
      })
      .select("id")
      .single();

    if (entryError) {
      // Duplicate submission — idempotency key already used. Return the existing entry id.
      if (entryError.code === "23505" && idempotencyKey) {
        const { data: existing } = await supabase
          .from("journal_entries")
          .select("id")
          .eq("idempotency_key", idempotencyKey)
          .single();
        if (existing?.id) return { success: true, id: existing.id };
      }
      return { success: false, error: entryError.message || "Failed to save entry." };
    }
    if (!entry?.id) return { success: false, error: "Failed to save entry." };

    // Insert junction table rows for all selected members
    if (input.member_ids.length > 0) {
      const { error: junctionErr } = await supabase.from("journal_entry_members").insert(
        input.member_ids.map((memberId: string) => ({
          journal_entry_id: entry.id,
          family_member_id: memberId,
        }))
      );
      if (junctionErr) console.error("[createJournalEntry] journal_entry_members insert failed:", junctionErr.message);
    }

  // If location provided, geocode (if needed) and create map pin with clustering
  if (input.location?.trim()) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      let lat = 0;
      let lng = 0;
      let countryCode: string | null = null;

      if (input.location_lat && input.location_lng) {
        lat = input.location_lat;
        lng = input.location_lng;
        if (apiKey) {
          const geocodeRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
          );
          const geocode = await geocodeRes.json();
          if (geocode.status === "OK" && geocode.results?.[0]) {
            const countryComp = geocode.results[0].address_components?.find(
              (c: { types: string[] }) => c.types.includes("country")
            );
            countryCode = countryComp?.short_name?.toUpperCase() ?? null;
          }
        }
      } else {
        // Try Google first; fall back to Nominatim if key absent or API returns non-OK
        let googleSucceeded = false;
        if (apiKey) {
          const geocodeRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input.location.trim())}&key=${apiKey}`
          );
          const geocode = await geocodeRes.json();
          if (geocode.status === "OK" && geocode.results?.[0]) {
            const result = geocode.results[0];
            lat = result.geometry.location.lat;
            lng = result.geometry.location.lng;
            const countryComp = result.address_components?.find((c: { types: string[] }) =>
              c.types.includes("country")
            );
            countryCode = countryComp?.short_name?.toUpperCase() ?? null;
            googleSucceeded = true;
          }
        }
        if (!googleSucceeded) {
          const geocodeRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(input.location.trim())}&limit=1`,
            { headers: { "User-Agent": "FamilyNest/1.0" } }
          );
          const geocode = await geocodeRes.json();
          const result = geocode[0];
          lat = result?.lat ? parseFloat(result.lat) : 0;
          lng = result?.lon ? parseFloat(result.lon) : 0;
          countryCode = result?.address?.country_code?.toUpperCase() ?? null;
        }
      }

      if (lat && lng) {
        const date = input.trip_date ? new Date(input.trip_date) : new Date();
        if (process.env.NODE_ENV === "development") {
          console.log("[journal] Clustering:", {
            location: input.location.trim(),
            lat,
            lng,
            date: date.toISOString().split("T")[0],
          });
        }
        const locationClusterId = await findOrCreateLocationCluster(supabase, activeFamilyId, {
          latitude: lat,
          longitude: lng,
          location_name: input.location.trim(),
          date,
        });
        if (process.env.NODE_ENV === "development") {
          console.log("[journal] Cluster ID:", locationClusterId ?? "(null – pin will show alone)");
        }

        const yearVisited = input.trip_date ? new Date(input.trip_date).getFullYear() : null;
        const { data: travelLoc } = await supabase.from("travel_locations").insert({
          family_id: activeFamilyId,
          family_member_id: input.member_ids[0],
          lat,
          lng,
          location_name: input.location.trim(),
          year_visited: yearVisited,
          trip_date: input.trip_date || null,
          notes: input.title,
          country_code: countryCode,
          journal_entry_id: entry.id,
          location_cluster_id: locationClusterId,
          location_type:
            input.location_type === "vacation" || input.location_type === "memorable_event" ? input.location_type : null,
        }).select("id").single();

        // Insert junction table rows for travel location members
        if (travelLoc?.id && input.member_ids.length > 0) {
          const { error: locJunctionErr } = await supabase.from("travel_location_members").insert(
            input.member_ids.map((memberId: string) => ({
              travel_location_id: travelLoc.id,
              family_member_id: memberId,
            }))
          );
          if (locJunctionErr) console.error("[createJournalEntry] travel_location_members insert failed:", locJunctionErr.message);
        }
      }
    } catch (geoErr) {
      // Geocoding failed - journal entry still saved, just no map pin
      console.warn("[createJournalEntry] Geocoding failed:", geoErr);
    }
  }

  // Upload photos (max 5 per journal entry)
  const allPhotos = formData.getAll("photos") as File[];
  const photos = allPhotos.filter((f) => f.size > 0).slice(0, 20);

  // Check total upload size against storage limit — skip photos if exceeded (G2)
  const totalUploadBytes = photos.reduce((s, f) => s + f.size, 0);
  let withinStorageLimit = true;
  try { await enforceStorageLimit(supabase, activeFamilyId, totalUploadBytes); } catch { withinStorageLimit = false; }

  for (let i = 0; withinStorageLimit && i < photos.length; i++) {
    const file = photos[i];
    if (file.size === 0) continue;

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${entry.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("journal-photos")
        .upload(path, file, { upsert: true });

      if (uploadError) continue;

      // Track storage
      await addStorageUsage(supabase, activeFamilyId, file.size);

      const photoUrl = `/api/storage/journal-photos/${path}`;

      const { error: photoErr } = await supabase.from("journal_photos").insert({
        family_id: activeFamilyId,
        entry_id: entry.id,
        url: photoUrl,
        sort_order: i,
        file_size_bytes: file.size,
      });
      if (photoErr) {
        // Rollback: storage upload succeeded but DB insert failed (W6)
        const { error: removeErr } = await supabase.storage.from("journal-photos").remove([path]);
        if (removeErr) console.error("[createJournalEntry] Photo rollback remove failed:", removeErr.message);
        await subtractStorageUsage(supabase, activeFamilyId, file.size);
        continue;
      }

    } catch {
      // Skip this photo and continue so one bad file doesn't fail the whole entry
    }
  }

  // Upload videos — limit per entry depends on plan
  // NOTE: Videos are now uploaded client-side via registerJournalVideo() to avoid
  // Vercel payload limits. This block is kept for backward compatibility but will
  // typically receive an empty array.
  const maxVideos = videosPerEntryLimit(plan.planType);
  const allVideos = formData.getAll("videos") as File[];
  const validVideos = allVideos.filter((f) => f.size > 0 && f.size <= VIDEO_LIMITS.maxSizeBytes).slice(0, maxVideos);

  for (let i = 0; i < validVideos.length; i++) {
    const file = validVideos[i];
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${entry.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("journal-videos")
        .upload(path, file, { upsert: true });

      if (uploadError) continue;

      // Track storage
      await addStorageUsage(supabase, activeFamilyId, file.size);

      const { error: videoErr } = await supabase.from("journal_videos").insert({
        family_id: activeFamilyId,
        entry_id: entry.id,
        url: `/api/storage/journal-videos/${path}`,
        file_size_bytes: file.size,
        sort_order: i,
        uploaded_by: myMember?.id || null,
      });
      if (videoErr) {
        // Rollback: storage upload succeeded but DB insert failed (W6)
        const { error: removeErr } = await supabase.storage.from("journal-videos").remove([path]);
        if (removeErr) console.error("[createJournalEntry] Video rollback remove failed:", removeErr.message);
        await subtractStorageUsage(supabase, activeFamilyId, file.size);
      }
    } catch {
      // Skip failed video — entry is still saved
    }
  }

    revalidatePath("/dashboard/journal");
    revalidatePath("/dashboard/map");
    revalidatePath("/");
  
    return { success: true, id: entry.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { success: false, error: message };
  }
}

export async function updateJournalEntry(entryId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Get current user's member record for ownership check
  const { data: myMember } = await supabase
    .from("family_members")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!myMember) throw new Error("Family member not found.");

  // Verify the entry belongs to the active family AND the current user can edit it
  const { data: existingEntry } = await supabase
    .from("journal_entries")
    .select("family_id, author_id, created_by")
    .eq("id", entryId)
    .single();

  if (!existingEntry || existingEntry.family_id !== activeFamilyId) {
    throw new Error("Entry not found or access denied.");
  }

  // Only the owner role or the person who created the entry can edit it
  const isOwner = myMember.role === "owner";
  const isCreator = existingEntry.created_by
    ? existingEntry.created_by === myMember.id
    : existingEntry.author_id === myMember.id;

  if (!isOwner && !isCreator) {
    throw new Error("You can only edit your own journal entries.");
  }

  // Extract and validate FormData — deduplicate in case client sends IDs twice
  const memberIds = [...new Set(formData.getAll("member_ids").map(String).filter(Boolean))];
  const rawData = {
    family_member_id: memberIds[0] || null,
    member_ids: memberIds,
    title: getFormString(formData, "title"),
    content: getFormString(formData, "content"),
    location: getFormString(formData, "location"),
    trip_date: getFormString(formData, "trip_date"),
    trip_date_end: getFormString(formData, "trip_date_end"),
    location_lat: getFormString(formData, "location_lat"),
    location_lng: getFormString(formData, "location_lng"),
    location_type: getFormString(formData, "location_type"),
  };

  const validation = validateSchema(createJournalEntrySchema, rawData);
  if (!validation.success) {
    throw new Error(validation.error);
  }

  const input = validation.data;

  // Update junction table: delete old, insert new
  await supabase.from("journal_entry_members").delete().eq("journal_entry_id", entryId);
  if (input.member_ids.length > 0) {
    const { error: junctionErr } = await supabase.from("journal_entry_members").insert(
      input.member_ids.map((memberId: string) => ({
        journal_entry_id: entryId,
        family_member_id: memberId,
      }))
    );
    if (junctionErr) console.error("[updateJournalEntry] journal_entry_members insert failed:", junctionErr.message);
  }

  // Allow author override (writing on behalf of someone)
  const authorOverrideId = getFormString(formData, "author_override") || null;
  const updateFields: Record<string, unknown> = {
    title: input.title,
    content: input.content,
    location: input.location,
    trip_date: input.trip_date,
    trip_date_end: input.trip_date_end,
    updated_at: new Date().toISOString(),
  };
  if (authorOverrideId) updateFields.author_id = authorOverrideId;

  const { error: updateError } = await supabase
    .from("journal_entries")
    .update(updateFields)
    .eq("id", entryId);

  if (updateError) throw updateError;

  // Sync map pin: remove existing pin for this entry, then add new one if location provided
  await supabase
    .from("travel_locations")
    .delete()
    .eq("journal_entry_id", entryId);

  if (input.location?.trim()) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      let lat = 0;
      let lng = 0;
      let countryCode: string | null = null;

      if (input.location_lat && input.location_lng) {
        lat = input.location_lat;
        lng = input.location_lng;
        if (apiKey) {
          const geocodeRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
          );
          const geocode = await geocodeRes.json();
          if (geocode.status === "OK" && geocode.results?.[0]) {
            const countryComp = geocode.results[0].address_components?.find(
              (c: { types: string[] }) => c.types.includes("country")
            );
            countryCode = countryComp?.short_name?.toUpperCase() ?? null;
          }
        }
      } else {
        // Try Google first; fall back to Nominatim if key absent or API returns non-OK
        let googleSucceeded = false;
        if (apiKey) {
          const geocodeRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input.location.trim())}&key=${apiKey}`
          );
          const geocode = await geocodeRes.json();
          if (geocode.status === "OK" && geocode.results?.[0]) {
            const result = geocode.results[0];
            lat = result.geometry.location.lat;
            lng = result.geometry.location.lng;
            const countryComp = result.address_components?.find((c: { types: string[] }) =>
              c.types.includes("country")
            );
            countryCode = countryComp?.short_name?.toUpperCase() ?? null;
            googleSucceeded = true;
          }
        }
        if (!googleSucceeded) {
          const geocodeRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(input.location.trim())}&limit=1`,
            { headers: { "User-Agent": "FamilyNest/1.0" } }
          );
          const geocode = await geocodeRes.json();
          const result = geocode[0];
          lat = result?.lat ? parseFloat(result.lat) : 0;
          lng = result?.lon ? parseFloat(result.lon) : 0;
          countryCode = result?.address?.country_code?.toUpperCase() ?? null;
        }
      }

      if (lat && lng) {
        const date = input.trip_date ? new Date(input.trip_date) : new Date();
        const locationClusterId = await findOrCreateLocationCluster(supabase, activeFamilyId, {
          latitude: lat,
          longitude: lng,
          location_name: input.location.trim(),
          date,
        });
        const yearVisited = input.trip_date ? new Date(input.trip_date).getFullYear() : null;
        const { data: travelLoc } = await supabase.from("travel_locations").insert({
          family_id: activeFamilyId,
          family_member_id: input.member_ids[0],
          lat,
          lng,
          location_name: input.location.trim(),
          year_visited: yearVisited,
          trip_date: input.trip_date || null,
          notes: input.title,
          country_code: countryCode,
          journal_entry_id: entryId,
          location_cluster_id: locationClusterId,
          location_type:
            input.location_type === "vacation" || input.location_type === "memorable_event" ? input.location_type : null,
        }).select("id").single();

        // Insert junction table rows for travel location members
        if (travelLoc?.id && input.member_ids.length > 0) {
          const { error: locJunctionErr } = await supabase.from("travel_location_members").insert(
            input.member_ids.map((memberId: string) => ({
              travel_location_id: travelLoc.id,
              family_member_id: memberId,
            }))
          );
          if (locJunctionErr) console.error("[updateJournalEntry] travel_location_members insert failed:", locJunctionErr.message);
        }
      }
    } catch (geoErr) {
      // Geocoding failed – entry updated, map pin may be missing
      console.warn("[updateJournalEntry] Geocoding failed:", geoErr);
    }
  }

  revalidatePath("/dashboard/journal");
  revalidatePath(`/dashboard/journal/${entryId}`);
  revalidatePath("/dashboard/map");
}

export async function addJournalPhotos(entryId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { count } = await supabase
    .from("journal_photos")
    .select("id", { count: "exact", head: true })
    .eq("entry_id", entryId);

  const existingCount = count ?? 0;
  const JOURNAL_PHOTO_LIMIT = 20;
  if (existingCount >= JOURNAL_PHOTO_LIMIT) {
    throw new Error(`Each journal entry can have up to ${JOURNAL_PHOTO_LIMIT} photos.`);
  }

  const allPhotos = formData.getAll("photos") as File[];
  const validPhotos = allPhotos.filter((f) => f.size > 0);
  const toAdd = Math.min(validPhotos.length, JOURNAL_PHOTO_LIMIT - existingCount);
  if (toAdd === 0) return;

  const photos = validPhotos.slice(0, toAdd);
  const startOrder = existingCount;

  for (let i = 0; i < photos.length; i++) {
    const file = photos[i];
    if (file.size === 0) continue;

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${entryId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("journal-photos")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      await addStorageUsage(supabase, activeFamilyId, file.size);

      const photoUrl = `/api/storage/journal-photos/${path}`;

      await supabase.from("journal_photos").insert({
        family_id: activeFamilyId,
        entry_id: entryId,
        url: photoUrl,
        sort_order: startOrder + i,
      });
    }
  }

  revalidatePath("/dashboard/journal");
  revalidatePath(`/dashboard/journal/${entryId}`);
  revalidatePath("/");

}

/**
 * Register a photo that was uploaded directly to Supabase Storage from the client.
 * This avoids sending large image files through server actions (Vercel payload limit).
 */
export async function registerJournalPhoto(
  entryId: string,
  storagePath: string,
  fileSizeBytes: number,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const JOURNAL_PHOTO_LIMIT = 20;
  const { count } = await supabase
    .from("journal_photos")
    .select("id", { count: "exact", head: true })
    .eq("entry_id", entryId);
  const existingCount = count ?? 0;
  if (existingCount >= JOURNAL_PHOTO_LIMIT) {
    throw new Error(`Each journal entry can have up to ${JOURNAL_PHOTO_LIMIT} photos.`);
  }

  await addStorageUsage(supabase, activeFamilyId, fileSizeBytes);

  const photoUrl = `/api/storage/journal-photos/${storagePath}`;
  const { data: photoRow, error: photoErr } = await supabase.from("journal_photos").insert({
    family_id: activeFamilyId,
    entry_id: entryId,
    url: photoUrl,
    sort_order: existingCount,
  }).select("id").single();
  if (photoErr) throw new Error(photoErr.message);

  revalidatePath("/dashboard/journal");
  revalidatePath(`/dashboard/journal/${entryId}`);
  revalidatePath("/");

  return photoRow?.id ?? null;
}

/**
 * Set a photo as the cover photo for a journal entry.
 */
export async function setJournalCoverPhoto(entryId: string, photoId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { error } = await supabase
    .from("journal_entries")
    .update({ cover_photo_id: photoId })
    .eq("id", entryId)
    .eq("family_id", activeFamilyId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/journal");
  revalidatePath(`/dashboard/journal/${entryId}`);
}

export async function deleteJournalPhoto(photoId: string, entryId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Fetch before deleting so we can clean up storage (W1)
  const { data: photo } = await supabase
    .from("journal_photos")
    .select("url, file_size_bytes")
    .eq("id", photoId)
    .eq("family_id", activeFamilyId)
    .single();

  const { error } = await supabase
    .from("journal_photos")
    .delete()
    .eq("id", photoId)
    .eq("family_id", activeFamilyId);

  if (error) throw error;

  // Remove file from storage (W1)
  if (photo?.url) {
    const storagePath = photo.url.replace("/api/storage/journal-photos/", "");
    await supabase.storage.from("journal-photos").remove([storagePath]);
  }
  if (photo?.file_size_bytes && photo.file_size_bytes > 0) {
    await subtractStorageUsage(supabase, activeFamilyId, photo.file_size_bytes);
  }

  revalidatePath("/dashboard/journal");
  if (entryId) revalidatePath(`/dashboard/journal/${entryId}/edit`);
  revalidatePath("/");

}

export async function addJournalPerspective(
  entryId: string,
  content: string,
  familyMemberId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("journal_perspectives").insert({
    journal_entry_id: entryId,
    family_member_id: familyMemberId,
    content: content.trim(),
  });

  if (error) throw error;
  revalidatePath("/dashboard/journal");
  revalidatePath(`/dashboard/journal/${entryId}/edit`);
}

export async function removeJournalPerspective(id: string, entryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("journal_perspectives").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/journal");
  revalidatePath(`/dashboard/journal/${entryId}/edit`);
}

export async function deleteJournalEntry(entryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { data: myMember } = await supabase
    .from("family_members")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!myMember) throw new Error("Family member not found.");

  const { data: entry, error: fetchError } = await supabase
    .from("journal_entries")
    .select("id, family_id, author_id, created_by")
    .eq("id", entryId)
    .single();

  if (fetchError || !entry || entry.family_id !== activeFamilyId) {
    throw new Error("Entry not found or you don't have access.");
  }

  const isOwner = myMember.role === "owner";
  const isCreator = entry.created_by
    ? entry.created_by === myMember.id
    : entry.author_id === myMember.id;

  if (!isOwner && !isCreator) {
    throw new Error("You can only delete your own journal entries.");
  }

  await supabase
    .from("travel_locations")
    .delete()
    .eq("journal_entry_id", entryId);

  const { error: deleteError } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", entryId);

  if (deleteError) throw new Error(deleteError.message);

  revalidatePath("/dashboard/journal");
  revalidatePath("/dashboard/map");
  revalidatePath("/");
}

/* ── Video actions ───────────────────────────────────────── */

export async function addJournalVideos(entryId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const plan = await getFamilyPlan(supabase, activeFamilyId);

  // Get logged-in user's member record
  const { data: myMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  const { count } = await supabase
    .from("journal_videos")
    .select("id", { count: "exact", head: true })
    .eq("entry_id", entryId);

  const existingCount = count ?? 0;
  if (existingCount >= VIDEO_LIMITS.maxVideosPerJournalEntry) {
    throw new Error(`Each journal entry can have up to ${VIDEO_LIMITS.maxVideosPerJournalEntry} videos.`);
  }

  const allVideos = formData.getAll("videos") as File[];
  const validVideos = allVideos.filter((f) => f.size > 0 && f.size <= VIDEO_LIMITS.maxSizeBytes);
  const toAdd = Math.min(validVideos.length, VIDEO_LIMITS.maxVideosPerJournalEntry - existingCount);
  if (toAdd === 0) return;

  const vids = validVideos.slice(0, toAdd);
  const startOrder = existingCount;

  // Enforce storage limit for the total batch (G3)
  const totalVideoBytes = vids.reduce((s, f) => s + f.size, 0);
  await enforceStorageLimit(supabase, activeFamilyId, totalVideoBytes);

  for (let i = 0; i < vids.length; i++) {
    const file = vids[i];
    const ext = file.name.split(".").pop() || "mp4";
    const path = `${entryId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("journal-videos")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      await addStorageUsage(supabase, activeFamilyId, file.size);

      await supabase.from("journal_videos").insert({
        family_id: activeFamilyId,
        entry_id: entryId,
        url: `/api/storage/journal-videos/${path}`,
        file_size_bytes: file.size,
        sort_order: startOrder + i,
        uploaded_by: myMember?.id || null,
      });
    }
  }

  revalidatePath("/dashboard/journal");
  revalidatePath(`/dashboard/journal/${entryId}`);
}

/**
 * Register a video that was uploaded directly to Supabase Storage from the client.
 * This avoids sending large video files through server actions (Vercel payload limit).
 */
export async function registerJournalVideo(
  entryId: string,
  url: string,
  storagePath: string,
  fileSizeBytes: number,
  durationSeconds: number | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Get member record
  const { data: myMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  // Count existing videos
  const { count } = await supabase
    .from("journal_videos")
    .select("id", { count: "exact", head: true })
    .eq("entry_id", entryId);

  const existingCount = count ?? 0;
  if (existingCount >= VIDEO_LIMITS.maxVideosPerJournalEntry) {
    throw new Error(`Each journal entry can have up to ${VIDEO_LIMITS.maxVideosPerJournalEntry} videos.`);
  }

  // Enforce storage limit before tracking (G3)
  await enforceStorageLimit(supabase, activeFamilyId, fileSizeBytes);
  await addStorageUsage(supabase, activeFamilyId, fileSizeBytes);

  // Insert DB record
  await supabase.from("journal_videos").insert({
    family_id: activeFamilyId,
    entry_id: entryId,
    url,
    file_size_bytes: fileSizeBytes,
    duration_seconds: durationSeconds,
    sort_order: existingCount,
    uploaded_by: myMember?.id || null,
  });

  revalidatePath("/dashboard/journal");
  revalidatePath(`/dashboard/journal/${entryId}`);
}

export async function deleteJournalVideo(videoId: string, entryId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Fetch the video record so we can remove the file and decrement storage (B5)
  const { data: videoRow } = await supabase
    .from("journal_videos")
    .select("url, file_size_bytes")
    .eq("id", videoId)
    .eq("family_id", activeFamilyId)
    .single();

  const { error } = await supabase
    .from("journal_videos")
    .delete()
    .eq("id", videoId)
    .eq("family_id", activeFamilyId);

  if (error) throw error;

  // Remove storage object and decrement counter (W10)
  if (videoRow?.url) {
    const storagePath = videoRow.url.replace("/api/storage/journal-videos/", "");
    const { error: storageErr } = await supabase.storage.from("journal-videos").remove([storagePath]);
    if (storageErr) {
      console.error("[deleteJournalVideo] storage removal failed:", storageErr.message);
    }
  }
  if (videoRow?.file_size_bytes && activeFamilyId) {
    await subtractStorageUsage(supabase, activeFamilyId, videoRow.file_size_bytes);
  }

  revalidatePath("/dashboard/journal");
  if (entryId) revalidatePath(`/dashboard/journal/${entryId}/edit`);
}
