import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { PersonalizeClient } from "./PersonalizeClient";
import { redirect } from "next/navigation";

export default async function PersonalizePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) redirect("/dashboard");

  // Get the logged-in user's own member record
  const { data: currentMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  // Load all other family members (not yourself)
  const { data: members } = await supabase
    .from("family_members")
    .select("id, name, nickname, relationship, avatar_url")
    .eq("family_id", activeFamilyId)
    .order("name");

  const otherMembers = (members ?? []).filter((m) => m.id !== currentMember?.id);

  // Load any existing aliases this user has already set
  const { data: existingAliases } = currentMember
    ? await supabase
        .from("member_aliases")
        .select("target_member_id, label")
        .eq("viewer_member_id", currentMember.id)
    : { data: [] };

  const aliasMap: Record<string, string> = Object.fromEntries(
    (existingAliases ?? []).map((a) => [a.target_member_id, a.label])
  );

  return <PersonalizeClient members={otherMembers} aliasMap={aliasMap} />;
}
