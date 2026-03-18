import type { SupabaseClient } from "@supabase/supabase-js";
import { FEATURE_CATALOG, type CatalogFeature } from "./feature-catalog";

/**
 * Fetch the list of enabled add-on feature slugs for a family.
 */
export async function getEnabledFeatureSlugs(
  supabase: SupabaseClient,
  familyId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("family_enabled_features")
    .select("feature_slug")
    .eq("family_id", familyId);

  return (data ?? []).map((row) => row.feature_slug);
}

/**
 * Get the full catalog entries for a family's enabled features.
 * Only returns features that are both enabled AND available (built).
 */
export async function getEnabledFeatures(
  supabase: SupabaseClient,
  familyId: string
): Promise<CatalogFeature[]> {
  const slugs = await getEnabledFeatureSlugs(supabase, familyId);
  const slugSet = new Set(slugs);
  return FEATURE_CATALOG.filter(
    (f) => slugSet.has(f.slug) && f.available
  );
}
