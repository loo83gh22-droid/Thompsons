import type { SupabaseClient } from "@supabase/supabase-js";
import { LOCATION_CONSTANTS, QUERY_LIMITS } from "./constants";

interface Location {
  latitude: number;
  longitude: number;
  location_name: string;
  date: Date;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Words from location name (lowercase, min 2 chars) for name-based matching. */
function locationWords(name: string): Set<string> {
  const words = new Set<string>();
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9\s,]/g, " ")
    .split(/[\s,]+/);
  for (const w of normalized) {
    if (w.length >= 2) words.add(w);
  }
  return words;
}

function sharesPlaceName(a: string, b: string): boolean {
  const wordsA = locationWords(a);
  const wordsB = locationWords(b);
  for (const w of wordsA) {
    if (w.length >= LOCATION_CONSTANTS.nameMatchMinLength && wordsB.has(w)) return true; // e.g. "uvita"
  }
  return false;
}

export async function findOrCreateLocationCluster(
  supabase: SupabaseClient,
  familyId: string,
  location: Location
): Promise<string | null> {
  const { data: existingClusters, error } = await supabase
    .from("location_clusters")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false })
    .limit(QUERY_LIMITS.locationClusters);

  if (error) {
    console.error("Error fetching clusters:", error);
    return null;
  }

  type ClusterRow = { id: string; date_range_start: string | null; date_range_end: string | null; entry_count: number | null };
  const updateCluster = async (cluster: ClusterRow) => {
    const clusterStartDate = cluster.date_range_start
      ? new Date(cluster.date_range_start)
      : new Date(location.date);
    const clusterEndDate = cluster.date_range_end
      ? new Date(cluster.date_range_end)
      : new Date(location.date);
    const newStartDate =
      location.date < clusterStartDate ? location.date : clusterStartDate;
    const newEndDate =
      location.date > clusterEndDate ? location.date : clusterEndDate;
    await supabase
      .from("location_clusters")
      .update({
        entry_count: (cluster.entry_count ?? 1) + 1,
        date_range_start: newStartDate.toISOString().split("T")[0],
        date_range_end: newEndDate.toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", cluster.id);
  };

  for (const cluster of existingClusters || []) {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      Number(cluster.latitude),
      Number(cluster.longitude)
    );
    const withinDistance = distance <= LOCATION_CONSTANTS.clusterDistanceKm;
    const withinNamed =
      distance <= LOCATION_CONSTANTS.clusterDistanceNamedKm &&
      sharesPlaceName(location.location_name, cluster.location_name ?? "");

    if (withinDistance || withinNamed) {
      await updateCluster(cluster);
      return cluster.id;
    }
  }

  const { data: newCluster, error: createError } = await supabase
    .from("location_clusters")
    .insert({
      family_id: familyId,
      location_name: location.location_name,
      latitude: location.latitude,
      longitude: location.longitude,
      date_range_start: location.date.toISOString().split("T")[0],
      date_range_end: location.date.toISOString().split("T")[0],
      entry_count: 1,
    })
    .select("id")
    .single();

  if (createError) {
    console.error("Error creating cluster:", createError);
    return null;
  }

  return newCluster.id;
}
