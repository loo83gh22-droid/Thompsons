"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { findOrCreateLocationCluster } from "@/src/lib/locationClustering";
import { getFamilyPlan, journalEntryLimit, canUploadVideos, enforceStorageLimit, addStorageUsage } from "@/src/lib/plans";

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

    const familyMemberId = formData.get("family_member_id") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const location = formData.get("location") as string;
    const tripDate = formData.get("trip_date") as string;
    const tripDateEnd = (formData.get("trip_date_end") as string) || null;
    const locationLat = formData.get("location_lat") as string | null;
    const locationLng = formData.get("location_lng") as string | null;
    const locationType = formData.get("location_type") as string | null;

    if (!familyMemberId) return { success: false, error: "Please select who this entry is about." };

    // Get the logged-in user's family_member record for created_by
    const { data: myMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single();

    const { data: entry, error: entryError } = await supabase
      .from("journal_entries")
      .insert({
        family_id: activeFamilyId,
        author_id: familyMemberId,
        created_by: myMember?.id || null,
        title,
        content: content || null,
        location: location || null,
        trip_date: tripDate || null,
        trip_date_end: tripDateEnd || null,
      })
      .select("id")
      .single();

    if (entryError) return { success: false, error: entryError.message || "Failed to save entry." };
    if (!entry?.id) return { success: false, error: "Failed to save entry." };

  // If location provided, geocode (if needed) and create map pin with clustering
  if (location?.trim()) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      let lat = 0;
      let lng = 0;
      let countryCode: string | null = null;

      if (locationLat && locationLng) {
        lat = parseFloat(locationLat);
        lng = parseFloat(locationLng);
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
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location.trim())}&key=${apiKey}`
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
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(location.trim())}&limit=1`,
          { headers: { "User-Agent": "Thompsons-Family-Site/1.0" } }
        );
        const geocode = await geocodeRes.json();
        const result = geocode[0];
        lat = result?.lat ? parseFloat(result.lat) : 0;
        lng = result?.lon ? parseFloat(result.lon) : 0;
        countryCode = result?.address?.country_code?.toUpperCase() ?? null;
      }

      if (lat && lng) {
        const date = tripDate ? new Date(tripDate) : new Date();
        if (process.env.NODE_ENV === "development") {
          console.log("[journal] Clustering:", {
            location: location.trim(),
            lat,
            lng,
            date: date.toISOString().split("T")[0],
          });
        }
        const locationClusterId = await findOrCreateLocationCluster(supabase, activeFamilyId, {
          latitude: lat,
          longitude: lng,
          location_name: location.trim(),
          date,
        });
        if (process.env.NODE_ENV === "development") {
          console.log("[journal] Cluster ID:", locationClusterId ?? "(null – pin will show alone)");
        }

        const yearVisited = tripDate ? new Date(tripDate).getFullYear() : null;
        await supabase.from("travel_locations").insert({
          family_id: activeFamilyId,
          family_member_id: familyMemberId,
          lat,
          lng,
          location_name: location.trim(),
          year_visited: yearVisited,
          trip_date: tripDate || null,
          notes: title,
          country_code: countryCode,
          journal_entry_id: entry.id,
          location_cluster_id: locationClusterId,
          location_type:
            locationType === "vacation" || locationType === "memorable_event" ? locationType : null,
        });
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
  const allVideos = formData.getAll("videos") as File[];
  const validVideos = canUploadVideos(plan.planType)
    ? allVideos.filter((f) => f.size > 0 && f.size <= MAX_VIDEO_BYTES).slice(0, JOURNAL_VIDEO_LIMIT)
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

  const familyMemberId = formData.get("family_member_id") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const location = formData.get("location") as string;
  const tripDate = formData.get("trip_date") as string;
  const tripDateEnd = (formData.get("trip_date_end") as string) || null;
  const locationLat = formData.get("location_lat") as string | null;
  const locationLng = formData.get("location_lng") as string | null;
  const locationType = formData.get("location_type") as string | null;

  if (!familyMemberId) throw new Error("Please select who this entry is about.");

  const { error: updateError } = await supabase
    .from("journal_entries")
    .update({
      author_id: familyMemberId,
      title,
      content: content || null,
      location: location || null,
      trip_date: tripDate || null,
      trip_date_end: tripDateEnd || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", entryId);

  if (updateError) throw updateError;

  // Sync map pin: remove existing pin for this entry, then add new one if location provided
  await supabase
    .from("travel_locations")
    .delete()
    .eq("journal_entry_id", entryId);

  if (location?.trim()) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      let lat = 0;
      let lng = 0;
      let countryCode: string | null = null;

      if (locationLat && locationLng) {
        lat = parseFloat(locationLat);
        lng = parseFloat(locationLng);
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
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location.trim())}&key=${apiKey}`
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
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(location.trim())}&limit=1`,
          { headers: { "User-Agent": "Thompsons-Family-Site/1.0" } }
        );
        const geocode = await geocodeRes.json();
        const result = geocode[0];
        lat = result?.lat ? parseFloat(result.lat) : 0;
        lng = result?.lon ? parseFloat(result.lon) : 0;
        countryCode = result?.address?.country_code?.toUpperCase() ?? null;
      }

      if (lat && lng) {
        const date = tripDate ? new Date(tripDate) : new Date();
        const locationClusterId = await findOrCreateLocationCluster(supabase, activeFamilyId, {
          latitude: lat,
          longitude: lng,
          location_name: location.trim(),
          date,
        });
        const yearVisited = tripDate ? new Date(tripDate).getFullYear() : null;
        await supabase.from("travel_locations").insert({
          family_id: activeFamilyId,
          family_member_id: familyMemberId,
          lat,
          lng,
          location_name: location.trim(),
          year_visited: yearVisited,
          trip_date: tripDate || null,
          notes: title,
          country_code: countryCode,
          journal_entry_id: entryId,
          location_cluster_id: locationClusterId,
          location_type:
            locationType === "vacation" || locationType === "memorable_event" ? locationType : null,
        });
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

const JOURNAL_VIDEO_LIMIT = 2;
const MAX_VIDEO_BYTES = 300 * 1024 * 1024;

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
  if (existingCount >= JOURNAL_VIDEO_LIMIT) {
    throw new Error(`Each journal entry can have up to ${JOURNAL_VIDEO_LIMIT} videos.`);
  }

  const allVideos = formData.getAll("videos") as File[];
  const validVideos = allVideos.filter((f) => f.size > 0 && f.size <= MAX_VIDEO_BYTES);
  const toAdd = Math.min(validVideos.length, JOURNAL_VIDEO_LIMIT - existingCount);
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
