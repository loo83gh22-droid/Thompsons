import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { FamilyWebClient } from "./FamilyWebClient";

export type FamilyMemberRow = {
  id: string;
  name: string;
  color: string;
};

export type RelationshipRow = {
  member_id: string;
  related_id: string;
  relationship_type: string;
};

export default async function RelationshipsPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name, color")
    .eq("family_id", activeFamilyId)
    .not("name", "eq", "Family")
    .order("name");

  const { data: relationships } = await supabase
    .from("family_relationships")
    .select("member_id, related_id, relationship_type")
    .eq("family_id", activeFamilyId);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        Family Web
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        See how everyone is connected. Click a member to view their relationships and contributions.
      </p>

      {!members?.length ? (
        <div className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <p className="text-[var(--muted)]">
            No family members yet. Add members in the Members section to see your family web.
          </p>
        </div>
      ) : (
        <FamilyWebClient
          members={members as FamilyMemberRow[]}
          relationships={(relationships ?? []) as RelationshipRow[]}
        />
      )}
    </div>
  );
}
