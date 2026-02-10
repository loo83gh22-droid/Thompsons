"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { findOrCreateLocationCluster } from "@/src/lib/locationClustering";

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
