import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AdventureClient } from "../adventure/AdventureClient";
import { FISHING_CONFIG } from "../adventure/presets";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata = { title: "Fishing Map | Family Nest" };

export default async function FishingMapPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const { data: locations } = await supabase
    .from("adventure_locations")
    .select("*")
    .eq("family_id", activeFamilyId)
    .eq("feature_slug", FISHING_CONFIG.featureSlug)
    .order("name");

  return (
    <AdventureClient
      config={FISHING_CONFIG}
      savedLocations={locations ?? []}
    />
  );
}
