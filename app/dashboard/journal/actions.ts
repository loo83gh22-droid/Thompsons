"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { findOrCreateLocationCluster } from "@/src/lib/locationClustering";
import { getFamilyPlan, journalEntryLimit, canUploadVideos, enforceStorageLimit, addStorageUsage } from "@/src/lib/plans";
import { VIDEO_LIMITS } from "@/src/lib/constants";
import { getFormString } from "@/src/lib/validation/schemas";
import { validateSchema } from "@/src/lib/validation/errors";
import { createJournalEntrySchema } from "./schemas";

async function getNextMosaicSortOrder(supabase: SupabaseClient, familyId: string) {
  const { data } = await supabase
    .from("home_mosaic_photos")
    .select("sort_order")
    .eq("family_id", familyId)
    .order("sort_order", { ascending: false })
    .limit(1);
  return (data?.[0]?.sort_order ?? -1) + 1;
}

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

    // Enforce journal entry limit for free tier
    const plan = await getFamilyPlan(supabase, activeFamilyId);
    const limit = journalEntryLimit(plan.planType);
    if (limit !== null) {
      const { count } = await supabase
        .from("journal_entries")
        .select("id", { count: "exact", head: true })
        .eq("family_id", activeFamilyId);
      if ((count ?? 0) >= limit) {
        return {
          success: false,
          error: `Free plan allows up to ${limit} journal entries. Upgrade to unlock unlimited entries.`,
        };
      }
    }

    // Extract and validate FormData
    const memberIds = formData.getAll("member_ids").map(String).filter(Boolean);
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

    // Get the logged-in user's family_member record for created_by
    const { data: myMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single();

    // author_override lets a user attribute the entry to another family member
    // (e.g., writing on behalf of a grandparent who doesn't have an account)
    const authorOverrideId = getFormString(formData, "author_override") || null;
    const authorId = authorOverrideId || myMember?.id || input.member_ids[0];

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
      })
      .select("id")
      .single();

    if (entryError) return { success: false, error: entryError.message || "Failed to save entry." };
    if (!entry?.id) return { success: false, error: "Failed to save entry." };

    // Insert junction table rows for all selected members
    if (input.member_ids.length > 0) {
      await supabase.from("journal_entry_members").insert(
        input.member_ids.map((memberId: string) => ({
          journal_entry_id: entry.id,
          family_member_id: memberId,
        }))
      );
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
      } else if (apiKey) {
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
        }
      } else {
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
          await supabase.from("travel_location_members").insert(
            input.member_ids.map((memberId: string) => ({
              travel_location_id: travelLoc.id,
              family_member_id: memberId,
            }))
          );
        }
      }
    } catch {
      // Geocoding failed - journal entry still saved, just no map pin
    }
  }

  // Upload photos (max 5 per journal entry)
  const allPhotos = formData.getAll("photos") as File[];
  const photos = allPhotos.filter((f) => f.size > 0).slice(0, 5);
  let mosaicOrder = await getNextMosaicSortOrder(supabase, activeFamilyId);

  // Check total upload size against storage limit
  const totalUploadBytes = photos.reduce((s, f) => s + f.size, 0);
  try { await enforceStorageLimit(supabase, activeFamilyId, totalUploadBytes); } catch { /* continue — don't block entry creation, just skip photos */ }

  for (let i = 0; i < photos.length; i++) {
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

      const { data: urlData } = supabase.storage
        .from("journal-photos")
        .getPublicUrl(path);

      const { error: photoErr } = await supabase.from("journal_photos").insert({
        family_id: activeFamilyId,
        entry_id: entry.id,
        url: urlData.publicUrl,
        sort_order: i,
      });
      if (photoErr) continue;

      await supabase.from("home_mosaic_photos").insert({
        family_id: activeFamilyId,
        url: urlData.publicUrl,
        sort_order: mosaicOrder++,
      });
    } catch {
      // Skip this photo and continue so one bad file doesn't fail the whole entry
    }
  }

  // Upload videos (max 2 per journal entry, 300 MB each) — paid plans only
  // NOTE: Videos are now uploaded client-side via registerJournalVideo() to avoid
  // Vercel payload limits. This block is kept for backward compatibility but will
  // typically receive an empty array.
  const allVideos = formData.getAll("videos") as File[];
  const validVideos = canUploadVideos(plan.planType)
    ? allVideos.filter((f) => f.size > 0 && f.size <= VIDEO_LIMITS.maxSizeBytes).slice(0, VIDEO_LIMITS.maxVideosPerJournalEntry)
    : []; // Free plan: skip videos silently

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

      const { data: urlData } = supabase.storage
        .from("journal-videos")
        .getPublicUrl(path);

      await supabase.from("journal_videos").insert({
        family_id: activeFamilyId,
        entry_id: entry.id,
        url: urlData.publicUrl,
        file_size_bytes: file.size,
        sort_order: i,
        uploaded_by: myMember?.id || null,
      });
    } catch {
      // Skip failed video — entry is still saved
    }
  }

    revalidatePath("/dashboard/journal");
    revalidatePath("/dashboard/map");
    revalidatePath("/");
    revalidatePath("/dashboard/photos");
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

  // Extract and validate FormData
  const memberIds = formData.getAll("member_ids").map(String).filter(Boolean);
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
    await supabase.from("journal_entry_members").insert(
      input.member_ids.map((memberId: string) => ({
        journal_entry_id: entryId,
        family_member_id: memberId,
      }))
    );
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
      } else if (apiKey) {
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
        }
      } else {
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
          await supabase.from("travel_location_members").insert(
            input.member_ids.map((memberId: string) => ({
              travel_location_id: travelLoc.id,
              family_member_id: memberId,
            }))
          );
        }
      }
    } catch {
      // Geocoding failed – entry updated, map pin may be missing
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
  const JOURNAL_PHOTO_LIMIT = 5;
  if (existingCount >= JOURNAL_PHOTO_LIMIT) {
    throw new Error(`Each journal entry can have up to ${JOURNAL_PHOTO_LIMIT} photos.`);
  }

  const allPhotos = formData.getAll("photos") as File[];
  const validPhotos = allPhotos.filter((f) => f.size > 0);
  const toAdd = Math.min(validPhotos.length, JOURNAL_PHOTO_LIMIT - existingCount);
  if (toAdd === 0) return;

  const photos = validPhotos.slice(0, toAdd);
  const startOrder = existingCount;
  let mosaicOrder = await getNextMosaicSortOrder(supabase, activeFamilyId);

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

      const { data: urlData } = supabase.storage
        .from("journal-photos")
        .getPublicUrl(path);

      await supabase.from("journal_photos").insert({
        family_id: activeFamilyId,
        entry_id: entryId,
        url: urlData.publicUrl,
        sort_order: startOrder + i,
      });

      // Also add to Photos (background mosaic)
      await supabase.from("home_mosaic_photos").insert({
        family_id: activeFamilyId,
        url: urlData.publicUrl,
        sort_order: mosaicOrder++,
      });
    }
  }

  revalidatePath("/dashboard/journal");
  revalidatePath(`/dashboard/journal/${entryId}`);
  revalidatePath("/");
  revalidatePath("/dashboard/photos");
}

export async function deleteJournalPhoto(photoId: string, entryId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("journal_photos")
    .delete()
    .eq("id", photoId);

  if (error) throw error;
  revalidatePath("/dashboard/journal");
  if (entryId) revalidatePath(`/dashboard/journal/${entryId}/edit`);
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

  const { data: entry, error: fetchError } = await supabase
    .from("journal_entries")
    .select("id, family_id")
    .eq("id", entryId)
    .single();

  if (fetchError || !entry || entry.family_id !== activeFamilyId) {
    throw new Error("Entry not found or you don't have access.");
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

  // Plan check: videos are paid-only
  const plan = await getFamilyPlan(supabase, activeFamilyId);
  if (!canUploadVideos(plan.planType)) {
    throw new Error("Video uploads require the Full Nest or Legacy plan. Upgrade to add videos.");
  }

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

  for (let i = 0; i < vids.length; i++) {
    const file = vids[i];
    const ext = file.name.split(".").pop() || "mp4";
    const path = `${entryId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("journal-videos")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      await addStorageUsage(supabase, activeFamilyId, file.size);

      const { data: urlData } = supabase.storage
        .from("journal-videos")
        .getPublicUrl(path);

      await supabase.from("journal_videos").insert({
        family_id: activeFamilyId,
        entry_id: entryId,
        url: urlData.publicUrl,
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

  // Plan check
  const plan = await getFamilyPlan(supabase, activeFamilyId);
  if (!canUploadVideos(plan.planType)) {
    throw new Error("Video uploads require the Full Nest or Legacy plan.");
  }

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

  // Track storage
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

  const { error } = await supabase
    .from("journal_videos")
    .delete()
    .eq("id", videoId);

  if (error) throw error;
  revalidatePath("/dashboard/journal");
  if (entryId) revalidatePath(`/dashboard/journal/${entryId}/edit`);
}
