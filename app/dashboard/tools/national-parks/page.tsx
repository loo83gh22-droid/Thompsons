import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AdventureClient } from "../adventure/AdventureClient";
import { NATIONAL_PARKS_CONFIG } from "../adventure/presets";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata = { title: "National Parks Tracker | Family Nest" };

export default async function NationalParksPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const { data: locations } = await supabase
    .from("adventure_locations")
    .select("*")
    .eq("family_id", activeFamilyId)
    .eq("feature_slug", NATIONAL_PARKS_CONFIG.featureSlug)
    .order("name");

  return (
    <AdventureClient
      config={NATIONAL_PARKS_CONFIG}
      savedLocations={locations ?? []}
    />
  );
}
