import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { FamilyWebClient } from "./FamilyWebClient";
import { EmptyStateGuide } from "@/app/components/EmptyStateGuide";
import type { FamilyMemberRow, RelationshipRow } from "./types";

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
        <div className="mt-6">
          <EmptyStateGuide
            icon={<span>&#x1F578;&#xFE0F;</span>}
            title="Your family web is waiting"
            description="Add family members to see how everyone is connected. Each person becomes a node in your family's web of relationships."
            inspiration={[
              "Add parents, siblings, and children",
              "See who shares the most memories together",
              "Discover connection patterns in your family",
            ]}
            ctaLabel="Add Family Members"
            ctaHref="/dashboard/our-family"
          />
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
