"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { findOrCreateLocationCluster } from "@/src/lib/locationClustering";
import { addStorageUsage, subtractStorageUsage } from "@/src/lib/plans";

export type HomeResult = { success: true; id: string } | { success: false; error: string };
type Result = { success: boolean; error?: string };

export async function createHome(formData: FormData): Promise<HomeResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { data: myMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single();

    const address = (formData.get("address") as string)?.trim() || null;
    const city = (formData.get("city") as string)?.trim() || null;
    const fromYearRaw = (formData.get("from_year") as string)?.trim();
    const toYearRaw = (formData.get("to_year") as string)?.trim();
    const notes = (formData.get("notes") as string)?.trim() || null;

    const from_year = fromYearRaw ? parseInt(fromYearRaw, 10) : null;
    const to_year = toYearRaw ? parseInt(toYearRaw, 10) : null;

    let memberIds: string[] = [];
    try { memberIds = JSON.parse((formData.get("member_ids") as string) || "[]"); } catch { /* ignore */ }

    const { data: home, error } = await supabase
      .from("family_homes")
      .insert({
        family_id: activeFamilyId,
        address,
        city,
        from_year,
        to_year,
        notes,
        created_by: myMember?.id ?? null,
      })
      .select("id")
      .single();

    if (error || !home?.id) return { success: false, error: error?.message ?? "Failed to save." };

    // Member junction
    if (memberIds.length > 0) {
      await supabase.from("family_home_members").insert(
        memberIds.map(mid => ({ home_id: home.id, member_id: mid }))
      );
    }

    // Map pin
    if (city) {
      await _upsertMapPin(supabase, activeFamilyId, home.id, city, from_year);
    }

    revalidatePath("/dashboard/homes");
    revalidatePath("/dashboard/map");
    return { success: true, id: home.id };
  } catch (err) {
    console.error("[createHome]", err);
    return { success: false, error: "Something went wrong." };
  }
}

export async function updateHome(homeId: string, formData: FormData): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const address = (formData.get("address") as string)?.trim() || null;
    const city = (formData.get("city") as string)?.trim() || null;
    const fromYearRaw = (formData.get("from_year") as string)?.trim();
    const toYearRaw = (formData.get("to_year") as string)?.trim();
    const notes = (formData.get("notes") as string)?.trim() || null;

    let memberIds: string[] = [];
    try { memberIds = JSON.parse((formData.get("member_ids") as string) || "[]"); } catch { /* ignore */ }

    const { error } = await supabase
      .from("family_homes")
      .update({
        address,
        city,
        from_year: fromYearRaw ? parseInt(fromYearRaw, 10) : null,
        to_year: toYearRaw ? parseInt(toYearRaw, 10) : null,
        notes,
      })
      .eq("id", homeId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };

    // Refresh members
    await supabase.from("family_home_members").delete().eq("home_id", homeId);
    if (memberIds.length > 0) {
      await supabase.from("family_home_members").insert(
        memberIds.map(mid => ({ home_id: homeId, member_id: mid }))
      );
    }

    revalidatePath("/dashboard/homes");
    revalidatePath(`/dashboard/homes/${homeId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function deleteHome(homeId: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("family_homes")
      .delete()
      .eq("id", homeId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/homes");
    revalidatePath("/dashboard/map");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function registerHomePhoto(
  homeId: string,
  storagePath: string,
  fileSize: number
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return null;

    const { data: myMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single();

    const { data: photo, error } = await supabase
      .from("family_home_photos")
      .insert({
        home_id: homeId,
        family_id: activeFamilyId,
        storage_path: storagePath,
        bucket: "home-photos",
        size_bytes: fileSize,
        uploaded_by: myMember?.id ?? null,
      })
      .select("id")
      .single();

    if (error) { console.error("[registerHomePhoto]", error.message); return null; }

    await addStorageUsage(supabase, activeFamilyId, fileSize);
    return photo.id;
  } catch {
    return null;
  }
}

export async function setHomeCoverPhoto(homeId: string, storagePath: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("family_homes")
      .update({ cover_photo_path: storagePath, cover_photo_bucket: "home-photos" })
      .eq("id", homeId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/homes");
    revalidatePath(`/dashboard/homes/${homeId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function deleteHomePhoto(photoId: string, homeId: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { data: photo } = await supabase
      .from("family_home_photos")
      .select("storage_path, size_bytes")
      .eq("id", photoId)
      .eq("family_id", activeFamilyId)
      .single();

    const { error } = await supabase
      .from("family_home_photos")
      .delete()
      .eq("id", photoId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };

    if (photo) {
      await supabase.storage.from("home-photos").remove([photo.storage_path]);
      await subtractStorageUsage(supabase, activeFamilyId, photo.size_bytes ?? 0);
    }

    revalidatePath(`/dashboard/homes/${homeId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ── Internal: geocode city and upsert travel_locations row ──────────────────

async function _upsertMapPin(
  supabase: Awaited<ReturnType<typeof import("@/src/lib/supabase/server").createClient>>,
  familyId: string,
  homeId: string,
  city: string,
  year: number | null
) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    let lat = 0;
    let lng = 0;
    let countryCode: string | null = null;

    if (apiKey) {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`);
      const data = await res.json();
      if (data.status === "OK" && data.results?.[0]) {
        lat = data.results[0].geometry.location.lat;
        lng = data.results[0].geometry.location.lng;
        const cc = data.results[0].address_components?.find((c: { types: string[] }) => c.types.includes("country"));
        countryCode = cc?.short_name?.toUpperCase() ?? null;
      }
    }
    if (!lat || !lng) {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(city)}&limit=1`, { headers: { "User-Agent": "FamilyNest/1.0" } });
      const data = await res.json();
      const r = data[0];
      lat = r?.lat ? parseFloat(r.lat) : 0;
      lng = r?.lon ? parseFloat(r.lon) : 0;
      countryCode = r?.address?.country_code?.toUpperCase() ?? null;
    }
    if (!lat || !lng) return;

    const date = year ? new Date(`${year}-01-01`) : new Date();
    const clusterId = await findOrCreateLocationCluster(supabase, familyId, { latitude: lat, longitude: lng, location_name: city, date });

    const { data: travelLoc } = await supabase
      .from("travel_locations")
      .insert({
        family_id: familyId,
        lat,
        lng,
        location_name: city,
        year_visited: year,
        country_code: countryCode,
        location_type: "memorable_event",
        cluster_id: clusterId,
        home_id: homeId,
      })
      .select("id")
      .single();

    if (travelLoc) {
      // Update home with map_location reference (no separate column needed — home_id is on travel_locations)
      void travelLoc;
    }
  } catch (err) {
    console.error("[_upsertMapPin homes]", err);
  }
}
