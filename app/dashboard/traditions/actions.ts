"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { getFamilyPlan, checkFeatureLimit } from "@/src/lib/plans";

export async function addTradition(data: {
  title: string;
  description: string;
  whenItHappens?: string;
  addedById?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Enforce tradition limit
  const plan = await getFamilyPlan(supabase, activeFamilyId);
  const limitError = await checkFeatureLimit(supabase, activeFamilyId, plan.planType, "traditions", "family_traditions");
  if (limitError) throw new Error(limitError);

  const { data: last } = await supabase
    .from("family_traditions")
    .select("sort_order")
    .eq("family_id", activeFamilyId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("family_traditions").insert({
    family_id: activeFamilyId,
    title: data.title.trim(),
    description: data.description.trim(),
    when_it_happens: data.whenItHappens?.trim() || null,
    added_by: data.addedById || null,
    sort_order: nextOrder,
  });

  if (error) throw error;
  revalidatePath("/dashboard/traditions");
}

export async function updateTradition(
  id: string,
  data: { title?: string; description?: string; whenItHappens?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("family_traditions")
    .update({
      title: data.title?.trim(),
      description: data.description?.trim(),
      when_it_happens: data.whenItHappens?.trim() || null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/traditions");
}

export async function removeTradition(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("family_traditions").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/traditions");
}
