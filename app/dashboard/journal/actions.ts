"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

async function getNextMosaicSortOrder(supabase: SupabaseClient, familyId: string) {
  const { data } = await supabase
    .from("home_mosaic_photos")
    .select("sort_order")
    .eq("family_id", familyId)
    .order("sort_order", { ascending: false })
    .limit(1);
  return (data?.[0]?.sort_order ?? -1) + 1;
}

export async function createJournalEntry(formData: FormData) {
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

  if (!familyMemberId) throw new Error("Please select who this entry is about.");

  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .insert({
      family_id: activeFamilyId,
      author_id: familyMemberId,
      title,
      content: content || null,
      location: location || null,
      trip_date: tripDate || null,
    })
    .select("id")
    .single();

  if (entryError) throw entryError;

  // If location provided, geocode and create map pin (linked to this journal entry)
  if (location?.trim()) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      let lat = 0;
      let lng = 0;
      let countryCode: string | null = null;

      if (apiKey) {
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

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${entry.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("journal-photos")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("journal-photos")
        .getPublicUrl(path);

      await supabase.from("journal_photos").insert({
        family_id: activeFamilyId,
        entry_id: entry.id,
        url: urlData.publicUrl,
        sort_order: i,
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
  revalidatePath("/dashboard/map");
  revalidatePath("/");
  revalidatePath("/dashboard/photos");
  return { success: true, id: entry.id };
}

export async function updateJournalEntry(entryId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const familyMemberId = formData.get("family_member_id") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const location = formData.get("location") as string;
  const tripDate = formData.get("trip_date") as string;

  if (!familyMemberId) throw new Error("Please select who this entry is about.");

  const { error: updateError } = await supabase
    .from("journal_entries")
    .update({
      author_id: familyMemberId,
      title,
      content: content || null,
      location: location || null,
      trip_date: tripDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", entryId);

  if (updateError) throw updateError;

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
