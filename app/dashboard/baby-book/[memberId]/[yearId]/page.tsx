import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { YearDetail } from "./YearDetail";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata = { title: "Baby Book Year | Family Nest" };

export default async function BabyBookYearPage({
  params,
}: {
  params: Promise<{ memberId: string; yearId: string }>;
}) {
  const { memberId, yearId } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const { data: member } = await supabase
    .from("family_members")
    .select("id, name, nickname, birth_date")
    .eq("id", memberId)
    .eq("family_id", activeFamilyId)
    .single();

  if (!member) notFound();

  const { data: entry } = await supabase
    .from("baby_book_years")
    .select(`
      id,
      year,
      note,
      created_at,
      baby_book_photos(id, url, sort_order)
    `)
    .eq("id", yearId)
    .eq("family_id", activeFamilyId)
    .single();

  if (!entry) notFound();

  // Get existing years for the edit form
  const { data: existingYearRows } = await supabase
    .from("baby_book_years")
    .select("year")
    .eq("family_member_id", memberId)
    .eq("family_id", activeFamilyId);

  const existingYears = (existingYearRows ?? []).map((r) => r.year);
  const displayName = member.nickname || member.name;

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 sm:px-6">
        <div className="text-sm text-[var(--muted)]">
          <Link href="/dashboard/baby-book" className="hover:text-[var(--foreground)]">
            Baby Books
          </Link>
          {" / "}
          <Link href={`/dashboard/baby-book/${memberId}`} className="hover:text-[var(--foreground)]">
            {displayName}
          </Link>
          {" / "}
          <span>{entry.year}</span>
        </div>
      </div>

      <YearDetail
        entry={entry}
        memberId={memberId}
        memberName={displayName}
        birthDate={member.birth_date ?? null}
        existingYears={existingYears}
      />
    </div>
  );
}
