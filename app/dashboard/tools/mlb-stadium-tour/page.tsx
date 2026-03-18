import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AdventureClient } from "../adventure/AdventureClient";
import { MLB_CONFIG } from "../adventure/presets";

export const metadata = { title: "MLB Stadium Tour | Family Nest" };

export default async function MlbStadiumTourPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: locations } = await supabase
    .from("adventure_locations")
    .select("*")
    .eq("family_id", activeFamilyId)
    .eq("feature_slug", MLB_CONFIG.featureSlug)
    .order("name");

  return (
    <AdventureClient
      config={MLB_CONFIG}
      savedLocations={locations ?? []}
    />
  );
}
