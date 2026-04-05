"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { findOrCreateLocationCluster } from "@/src/lib/locationClustering";
import { addStorageUsage, subtractStorageUsage } from "@/src/lib/plans";

export type VolunteerResult = { success: true; id: string } | { success: false; error: string };
type Result = { success: boolean; error?: string };

export async function createVolunteerEntry(formData: FormData): Promise<VolunteerResult> {
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

    const organization = (formData.get("organization") as string)?.trim();
    if (!organization) return { success: false, error: "Organization is required." };

    const date = (formData.get("date") as string)?.trim();
    if (!date) return { success: false, error: "Date is required." };

    const hoursRaw = (formData.get("hours") as string)?.trim();
    const hours = hoursRaw ? parseFloat(hoursRaw) : null;
    const description = (formData.get("description") as string)?.trim() || null;
    const cityRaw = (formData.get("city") as string)?.trim() || null;
    const city = cityRaw && cityRaw.length <= 100 ? cityRaw : cityRaw ? cityRaw.slice(0, 100) : null;
    const causeTagsRaw = (formData.get("cause_tags") as string)?.trim() || "";
    const cause_tags = causeTagsRaw ? causeTagsRaw.split(",").map(t => t.trim()).filter(Boolean) : null;

    let memberIds: string[] = [];
    try { memberIds = JSON.parse((formData.get("member_ids") as string) || "[]"); } catch { /* ignore */ }

    const { data: entry, error } = await supabase
      .from("volunteer_entries")
      .insert({
        family_id: activeFamilyId,
        organization,
        date,
        hours,
        description,
        city,
        cause_tags,
        added_by: myMember?.id ?? null,
      })
      .select("id")
      .single();

    if (error || !entry?.id) return { success: false, error: error?.message ?? "Failed to save." };

    if (memberIds.length > 0) {
      const { data: validMembers } = await supabase
        .from("family_members")
        .select("id")
        .eq("family_id", activeFamilyId)
        .in("id", memberIds);
      const validIds = (validMembers ?? []).map(m => m.id);
      if (validIds.length > 0) {
        await supabase.from("volunteer_entry_members").insert(
          validIds.map(mid => ({ entry_id: entry.id, member_id: mid }))
        );
      }
    }

    if (city) {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        let lat = 0, lng = 0, countryCode: string | null = null;
        if (apiKey) {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`);
          if (!res.ok) throw new Error(`Google geocode HTTP ${res.status}`);
          const gd = await res.json();
          if (gd.status === "OK" && gd.results?.[0]) {
            lat = gd.results[0].geometry.location.lat; lng = gd.results[0].geometry.location.lng;
            const cc = gd.results[0].address_components?.find((c: { types: string[] }) => c.types.includes("country"));
            countryCode = cc?.short_name?.toUpperCase() ?? null;
          }
        }
        if (!lat || !lng) {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(city)}&limit=1`, { headers: { "User-Agent": "FamilyNest/1.0" } });
          if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
          const nd = await res.json();
          lat = nd[0]?.lat ? parseFloat(nd[0].lat) : 0; lng = nd[0]?.lon ? parseFloat(nd[0].lon) : 0;
          countryCode = nd[0]?.address?.country_code?.toUpperCase() ?? null;
        }
        if (lat && lng) {
          const entryYear = new Date(date).getFullYear();
          const clusterId = await findOrCreateLocationCluster(supabase, activeFamilyId, { latitude: lat, longitude: lng, location_name: city, date: new Date(date) });
          const { data: travelLoc } = await supabase.from("travel_locations").insert({ family_id: activeFamilyId, lat, lng, location_name: city, year_visited: entryYear, country_code: countryCode, location_type: "memorable_event", cluster_id: clusterId }).select("id").single();
          if (travelLoc) {
            await supabase.from("volunteer_entries").update({ map_location_id: travelLoc.id }).eq("id", entry.id);
          }
        }
      } catch (err) {
        console.error("[volunteer map pin]", err);
      }
    }

    revalidatePath("/dashboard/volunteer");
    revalidatePath("/dashboard/map");
    return { success: true, id: entry.id };
  } catch (err) {
    console.error("[createVolunteerEntry]", err);
    return { success: false, error: "Something went wrong." };
  }
}

export async function deleteVolunteerEntry(entryId: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("volunteer_entries")
      .delete()
      .eq("id", entryId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/volunteer");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function registerVolunteerPhoto(
  entryId: string,
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
      .from("volunteer_photos")
      .insert({
        entry_id: entryId,
        family_id: activeFamilyId,
        storage_path: storagePath,
        bucket: "volunteer-photos",
        size_bytes: fileSize,
        uploaded_by: myMember?.id ?? null,
      })
      .select("id")
      .single();

    if (error) { console.error("[registerVolunteerPhoto]", error.message); return null; }
    await addStorageUsage(supabase, activeFamilyId, fileSize);
    return photo.id;
  } catch {
    return null;
  }
}

export async function deleteVolunteerPhoto(photoId: string, entryId: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { data: photo } = await supabase
      .from("volunteer_photos")
      .select("storage_path, size_bytes")
      .eq("id", photoId)
      .eq("family_id", activeFamilyId)
      .single();

    const { error } = await supabase
      .from("volunteer_photos")
      .delete()
      .eq("id", photoId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };

    if (photo) {
      await supabase.storage.from("volunteer-photos").remove([photo.storage_path]);
      await subtractStorageUsage(supabase, activeFamilyId, photo.size_bytes ?? 0);
    }

    revalidatePath(`/dashboard/volunteer/${entryId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}
