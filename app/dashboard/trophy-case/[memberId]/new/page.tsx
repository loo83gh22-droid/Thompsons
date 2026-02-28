import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { TrophyForm } from "./TrophyForm";

export default async function NewTrophyPage({
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

  const { data: allMembers } = await supabase
    .from("family_members")
    .select("id, name, nickname")
    .eq("family_id", activeFamilyId)
    .eq("is_remembered", false)
    .order("name");

  const displayName = member.nickname || member.name;

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <div className="mb-1 text-sm text-[var(--muted)]">
          <Link href="/dashboard/trophy-case" className="hover:text-[var(--foreground)]">
            Trophy Case
          </Link>
          {" / "}
          <Link href={`/dashboard/trophy-case/${memberId}`} className="hover:text-[var(--foreground)]">
            {displayName}
          </Link>
          {" / "}
          <span>Add trophy</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">
          Add a trophy for {displayName}
        </h1>
      </div>

      <TrophyForm
        defaultMemberId={memberId}
        allMembers={allMembers ?? []}
      />
    </div>
  );
}
