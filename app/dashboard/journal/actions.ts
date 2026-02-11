"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { findOrCreateLocationCluster } from "@/src/lib/locationClustering";

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

    const { data: entry, error: entryError } = await supabase
      .from("journal_entries")
      .insert({
        family_id: activeFamilyId,
        author_id: familyMemberId,
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

  // Upload photos (handle both single and multiple file inputs)
  const photos = formData.getAll("photos") as File[];
  let mosaicOrder = await getNextMosaicSortOrder(supabase, activeFamilyId);

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

  const startOrder = count ?? 0;
  const photos = formData.getAll("photos") as File[];
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
