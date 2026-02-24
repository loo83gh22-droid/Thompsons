import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AwardDetail } from "./AwardDetail";

export default async function AwardDetailPage({
  params,
}: {
  params: Promise<{ memberId: string; awardId: string }>;
}) {
  const { memberId, awardId } = await params;
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

  const { data: award } = await supabase
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
    .eq("id", awardId)
    .eq("family_id", activeFamilyId)
    .single();

  if (!award) notFound();

  // Get all family members for the "awarded to" section and edit form
  const { data: allMembers } = await supabase
    .from("family_members")
    .select("id, name, nickname")
    .eq("family_id", activeFamilyId)
    .eq("is_remembered", false)
    .order("name");

  const displayName = member.nickname || member.name;

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 sm:px-6">
        <div className="text-sm text-[var(--muted)]">
          <Link href="/dashboard/awards" className="hover:text-[var(--foreground)]">
            Awards &amp; Achievements
          </Link>
          {" / "}
          <Link href={`/dashboard/awards/${memberId}`} className="hover:text-[var(--foreground)]">
            {displayName}
          </Link>
          {" / "}
          <span>{award.title}</span>
        </div>
      </div>

      <AwardDetail
        award={award}
        memberId={memberId}
        memberName={displayName}
        allMembers={allMembers ?? []}
      />
    </div>
  );
}
