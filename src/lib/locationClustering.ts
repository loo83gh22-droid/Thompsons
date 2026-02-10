import type { SupabaseClient } from "@supabase/supabase-js";

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

export async function findOrCreateLocationCluster(
  supabase: SupabaseClient,
  familyId: string,
  location: Location
): Promise<string | null> {
  const DISTANCE_THRESHOLD_KM = 2.5; // same place (e.g. same town) – cluster by location only, any year

  const { data: existingClusters, error } = await supabase
    .from("location_clusters")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching clusters:", error);
    return null;
  }

  for (const cluster of existingClusters || []) {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      Number(cluster.latitude),
      Number(cluster.longitude)
    );

    if (distance <= DISTANCE_THRESHOLD_KM) {
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
