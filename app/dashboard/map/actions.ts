"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { findOrCreateLocationCluster } from "@/src/lib/locationClustering";

/** Get number of map pins for the active family (for first-time banner). */
export async function getMapPinCount(): Promise<number> {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return 0;
  const { count } = await supabase
    .from("travel_locations")
    .select("id", { count: "exact", head: true })
    .eq("family_id", activeFamilyId)
    .not("lat", "is", null)
    .not("lng", "is", null);
  return count ?? 0;
}

/** Re-run clustering for all pins so same-place entries share one cluster (fixes split pins e.g. Uvita). */
export async function rebuildLocationClusters(): Promise<{ updated: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { updated: 0, error: "Not authenticated" };
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { updated: 0, error: "No active family" };

  const { data: rows, error: fetchError } = await supabase
    .from("travel_locations")
    .select("id, lat, lng, location_name, trip_date")
    .eq("family_id", activeFamilyId)
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("trip_date", { ascending: true, nullsFirst: false });

  if (fetchError) return { updated: 0, error: fetchError.message };
  if (!rows?.length) {
    revalidatePath("/dashboard/map");
    return { updated: 0 };
  }

  let updated = 0;
  for (const row of rows) {
    const lat = Number(row.lat);
    const lng = Number(row.lng);
    const name = row.location_name?.trim();
    if (!name || Number.isNaN(lat) || Number.isNaN(lng)) continue;
    const date = row.trip_date ? new Date(row.trip_date) : new Date();
    const clusterId = await findOrCreateLocationCluster(supabase, activeFamilyId, {
      latitude: lat,
      longitude: lng,
      location_name: name,
      date,
    });
    if (clusterId) {
      const { error: updateErr } = await supabase
        .from("travel_locations")
        .update({ location_cluster_id: clusterId })
        .eq("id", row.id);
      if (!updateErr) updated++;
    }
  }

  revalidatePath("/dashboard/map");
  return { updated };
}

/** Create map pins for any family member who has a birth place set but no birth-place pin yet. */
export async function syncBirthPlacesToMap(): Promise<{ added: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { added: 0, error: "Not authenticated" };
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { added: 0, error: "No active family" };

  const { data: members, error: membersError } = await supabase
    .from("family_members")
    .select("id, name, birth_place, birth_date")
    .eq("family_id", activeFamilyId)
    .not("birth_place", "is", null);

  if (membersError) return { added: 0, error: membersError.message };
  if (!members?.length) {
    revalidatePath("/dashboard/map");
    return { added: 0 };
  }

  const { data: existingPins } = await supabase
    .from("travel_locations")
    .select("family_member_id")
    .eq("family_id", activeFamilyId)
    .eq("is_birth_place", true);

  const memberIdsWithPin = new Set((existingPins ?? []).map((p) => p.family_member_id));
  const toSync = members.filter((m) => m.birth_place?.trim() && !memberIdsWithPin.has(m.id));
  if (!toSync.length) {
    revalidatePath("/dashboard/map");
    return { added: 0 };
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  let added = 0;

  for (const member of toSync) {
    const birthPlace = member.birth_place?.trim();
    if (!birthPlace) continue;

    try {
      let lat = 0;
      let lng = 0;
      let countryCode: string | null = null;

      if (apiKey) {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(birthPlace)}&key=${apiKey}`
        );
        const json = await res.json();
        if (json.status === "OK" && json.results?.[0]) {
          const loc = json.results[0].geometry.location;
          lat = loc.lat;
          lng = loc.lng;
          const countryComp = json.results[0].address_components?.find(
            (c: { types: string[] }) => c.types.includes("country")
          );
          countryCode = countryComp?.short_name?.toUpperCase() ?? null;
        }
      } else {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(birthPlace)}&limit=1`,
          { headers: { "User-Agent": "FamilyNest/1.0" } }
        );
        const json = await res.json();
        const result = json[0];
        if (result?.lat && result?.lon) {
          lat = parseFloat(result.lat);
          lng = parseFloat(result.lon);
          countryCode = result?.address?.country_code?.toUpperCase() ?? null;
        }
      }

      if (lat && lng) {
        const yearVisited = member.birth_date
          ? new Date(member.birth_date + "T12:00:00").getFullYear()
          : null;
        const tripDate = member.birth_date ? member.birth_date.slice(0, 10) : null;
        const { error: insertErr } = await supabase.from("travel_locations").insert({
          family_id: activeFamilyId,
          family_member_id: member.id,
          lat,
          lng,
          location_name: birthPlace,
          year_visited: yearVisited,
          trip_date: tripDate,
          notes: "Birth place",
          country_code: countryCode,
          is_birth_place: true,
        });
        if (!insertErr) added++;
      }
    } catch {
      // Skip this member on geocode failure
    }
  }

  revalidatePath("/dashboard/map");
  return { added };
}
