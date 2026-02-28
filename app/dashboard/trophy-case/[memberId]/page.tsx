import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { TrophyGallery } from "./TrophyGallery";

export default async function MemberTrophyCasePage({
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

  const { data: memberAwardLinks } = await supabase
    .from("award_members")
    .select("award_id")
    .eq("family_member_id", memberId);

  const awardIds = memberAwardLinks?.map((m) => m.award_id) ?? [];

  const { data: trophies } = awardIds.length > 0
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
              <Link href="/dashboard/trophy-case" className="hover:text-[var(--foreground)]">
                Trophy Case
              </Link>
              {" / "}
              <span>{displayName}</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
              {displayName}&apos;s Trophy Case
            </h1>
            <p className="mt-1 text-[var(--muted)]">
              {trophies?.length ?? 0} {(trophies?.length ?? 0) === 1 ? "trophy" : "trophies"}
            </p>
          </div>
          <Link
            href={`/dashboard/trophy-case/${memberId}/new`}
            className="min-h-[44px] shrink-0 rounded-full bg-[var(--primary)] px-5 py-2 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            + Add trophy
          </Link>
        </div>
      </div>

      <TrophyGallery
        trophies={trophies ?? []}
        memberId={memberId}
        memberName={displayName}
        allMembers={allMembers ?? []}
      />
    </div>
  );
}
