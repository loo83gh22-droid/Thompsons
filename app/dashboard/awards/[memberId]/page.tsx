import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AwardsGallery } from "./AwardsGallery";

export default async function MemberAwardsPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: member } = await supabase
    .from("family_members")
    .select("id, name, nickname")
    .eq("id", memberId)
    .eq("family_id", activeFamilyId)
    .single();

  if (!member) notFound();

  // Get award IDs for this member
  const { data: memberAwardLinks } = await supabase
    .from("award_members")
    .select("award_id")
    .eq("family_member_id", memberId);

  const awardIds = memberAwardLinks?.map((m) => m.award_id) ?? [];

  // Get awards with files and member associations
  const { data: awards } = awardIds.length > 0
    ? await supabase
        .from("awards")
        .select(`
          id,
          title,
          description,
          category,
          awarded_by,
          award_date,
          created_at,
          award_files(id, url, file_type, file_name, sort_order),
          award_members(family_member_id)
        `)
        .eq("family_id", activeFamilyId)
        .in("id", awardIds)
        .order("award_date", { ascending: false, nullsFirst: false })
    : { data: [] };

  // Get all family members for "also awarded to" labels
  const { data: allMembers } = await supabase
    .from("family_members")
    .select("id, name, nickname")
    .eq("family_id", activeFamilyId)
    .eq("is_remembered", false);

  const displayName = member.nickname || member.name;

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-sm text-[var(--muted)]">
              <Link href="/dashboard/awards" className="hover:text-[var(--foreground)]">
                Awards &amp; Achievements
              </Link>
              {" / "}
              <span>{displayName}</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
              {displayName}&apos;s Awards
            </h1>
            <p className="mt-1 text-[var(--muted)]">
              {awards?.length ?? 0} {(awards?.length ?? 0) === 1 ? "award" : "awards"}
            </p>
          </div>
          <Link
            href={`/dashboard/awards/${memberId}/new`}
            className="min-h-[44px] shrink-0 rounded-full bg-[var(--primary)] px-5 py-2 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            + Add award
          </Link>
        </div>
      </div>

      <AwardsGallery
        awards={awards ?? []}
        memberId={memberId}
        memberName={displayName}
        allMembers={allMembers ?? []}
      />
    </div>
  );
}
