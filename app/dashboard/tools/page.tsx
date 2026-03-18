import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { getEnabledFeatureSlugs } from "@/src/lib/features";
import { FeatureCatalogClient } from "./FeatureCatalogClient";

export const metadata = { title: "Feature Catalog | Family Nest" };

export default async function FeatureCatalogPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);

  let enabledSlugs: string[] = [];
  if (activeFamilyId) {
    enabledSlugs = await getEnabledFeatureSlugs(supabase, activeFamilyId);
  }

  return <FeatureCatalogClient enabledSlugs={enabledSlugs} />;
}
