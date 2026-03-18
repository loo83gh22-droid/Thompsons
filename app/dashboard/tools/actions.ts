"use server";

import { createClient } from "@/src/lib/supabase/server";
import { requireRole } from "@/src/lib/requireRole";
import { getFeatureBySlug } from "@/src/lib/feature-catalog";
import { revalidatePath } from "next/cache";

export async function toggleFeature(featureSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Only adults and owners can manage features
  const { familyId, memberId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
  ]);

  const feature = getFeatureBySlug(featureSlug);
  if (!feature || !feature.available) {
    throw new Error("Feature not found or not yet available");
  }

  // Check if already enabled
  const { data: existing } = await supabase
    .from("family_enabled_features")
    .select("id")
    .eq("family_id", familyId)
    .eq("feature_slug", featureSlug)
    .maybeSingle();

  if (existing) {
    // Disable
    await supabase
      .from("family_enabled_features")
      .delete()
      .eq("id", existing.id);
  } else {
    // Enable
    await supabase.from("family_enabled_features").insert({
      family_id: familyId,
      feature_slug: featureSlug,
      enabled_by: memberId,
    });
  }

  revalidatePath("/dashboard", "layout");
}
