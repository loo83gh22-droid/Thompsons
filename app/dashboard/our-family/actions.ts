"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

/** Add a relationship. For child: memberId is child, relatedId is parent. For spouse: both directions are inserted. */
export async function addRelationship(
  memberId: string,
  relatedId: string,
  relationshipType: "spouse" | "child"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { error: "No family" };

  const { data: memberRow } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("id", memberId)
    .eq("family_id", activeFamilyId)
    .single();
  if (!memberRow) return { error: "Member not found" };

  const familyId = memberRow.family_id;
  if (relationshipType === "child") {
    const { error } = await supabase.from("family_relationships").insert({
      family_id: familyId,
      member_id: memberId,
      related_id: relatedId,
      relationship_type: "child",
    });
    return { error: error?.message };
  }
  const { error: e1 } = await supabase.from("family_relationships").insert({
    family_id: familyId,
    member_id: memberId,
    related_id: relatedId,
    relationship_type: "spouse",
  });
  if (e1) return { error: e1.message };
  const { error: e2 } = await supabase.from("family_relationships").insert({
    family_id: familyId,
    member_id: relatedId,
    related_id: memberId,
    relationship_type: "spouse",
  });
  return { error: e2?.message };
}

/** Remove one relationship (and the reverse for spouse). */
export async function removeRelationship(
  memberId: string,
  relatedId: string,
  relationshipType: "spouse" | "child"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { error: "No family" };

  await supabase
    .from("family_relationships")
    .delete()
    .eq("family_id", activeFamilyId)
    .eq("member_id", memberId)
    .eq("related_id", relatedId)
    .eq("relationship_type", relationshipType);
  if (relationshipType === "spouse") {
    await supabase
      .from("family_relationships")
      .delete()
      .eq("family_id", activeFamilyId)
      .eq("member_id", relatedId)
      .eq("related_id", memberId)
      .eq("relationship_type", "spouse");
  }
  revalidatePath("/dashboard/our-family");
  return {};
}

/** Replace all tree relationships for a member. Omitting a field clears those links. */
export async function setMemberRelationships(
  memberId: string,
  opts: { spouseId?: string | null; parentIds?: string[]; childIds?: string[] }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { error: "No family" };

  const { data: memberRow } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("id", memberId)
    .eq("family_id", activeFamilyId)
    .single();
  if (!memberRow) return { error: "Member not found" };
  const familyId = memberRow.family_id;

  const { data: existing } = await supabase
    .from("family_relationships")
    .select("member_id, related_id, relationship_type")
    .eq("family_id", familyId)
    .or(`member_id.eq.${memberId},related_id.eq.${memberId}`);

  const toDelete: { member_id: string; related_id: string; relationship_type: string }[] = existing ?? [];
  for (const row of toDelete) {
    await supabase
      .from("family_relationships")
      .delete()
      .eq("family_id", familyId)
      .eq("member_id", row.member_id)
      .eq("related_id", row.related_id)
      .eq("relationship_type", row.relationship_type);
  }

  const inserts: { family_id: string; member_id: string; related_id: string; relationship_type: string }[] = [];
  if (opts.spouseId) {
    inserts.push({ family_id: familyId, member_id: memberId, related_id: opts.spouseId, relationship_type: "spouse" });
    inserts.push({ family_id: familyId, member_id: opts.spouseId, related_id: memberId, relationship_type: "spouse" });
  }
  (opts.parentIds ?? []).forEach((parentId) => {
    inserts.push({ family_id: familyId, member_id: memberId, related_id: parentId, relationship_type: "child" });
  });
  (opts.childIds ?? []).forEach((childId) => {
    inserts.push({ family_id: familyId, member_id: childId, related_id: memberId, relationship_type: "child" });
  });
  if (inserts.length) {
    const { error } = await supabase.from("family_relationships").insert(inserts);
    if (error) return { error: error.message };
  }
  revalidatePath("/dashboard/our-family");
  return {};
}
