import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { MlbStadiumClient } from "./MlbStadiumClient";

export const metadata = { title: "MLB Stadium Tour | Family Nest" };

export default async function MlbStadiumTourPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  // Fetch locations, visits, photos, and members in parallel
  const [locRes, membersRes] = await Promise.all([
    supabase
      .from("adventure_locations")
      .select("*")
      .eq("family_id", activeFamilyId)
      .eq("feature_slug", "mlb-stadium-tour")
      .order("name"),
    supabase
      .from("family_members")
      .select("id, name, color")
      .eq("family_id", activeFamilyId)
      .order("name"),
  ]);

  const locations = locRes.data ?? [];
  const locationIds = locations.map((l) => l.id);

  // Fetch visits and photos for these locations
  const [visitsRes, photosRes] = locationIds.length > 0
    ? await Promise.all([
        supabase
          .from("adventure_location_visits")
          .select("*")
          .in("location_id", locationIds)
          .order("visited_date", { ascending: false }),
        supabase
          .from("adventure_location_photos")
          .select("*")
          .in("location_id", locationIds)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <MlbStadiumClient
      savedLocations={locations}
      visits={visitsRes.data ?? []}
      photos={photosRes.data ?? []}
      members={membersRes.data ?? []}
    />
  );
}
