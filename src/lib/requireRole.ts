import type { SupabaseClient } from "@supabase/supabase-js";
import { getActiveFamilyId } from "@/src/lib/family";
import type { MemberRole } from "@/src/lib/roles";

/**
 * Server-side role check. Returns the current user's family_member record
 * and verifies they have one of the allowed roles.
 *
 * Throws an error if the user doesn't have the required role.
 */
export async function requireRole(
  supabase: SupabaseClient,
  userId: string,
  allowedRoles: MemberRole[]
): Promise<{ memberId: string; role: MemberRole; familyId: string }> {
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { data: member } = await supabase
    .from("family_members")
    .select("id, role")
    .eq("user_id", userId)
    .eq("family_id", activeFamilyId)
    .single();

  if (!member) throw new Error("Not a member of this family");

  const role = member.role as MemberRole;
  if (!allowedRoles.includes(role)) {
    throw new Error(`This action requires one of: ${allowedRoles.join(", ")}. Your role is: ${role}`);
  }

  return { memberId: member.id, role, familyId: activeFamilyId };
}
