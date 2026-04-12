import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { BabyBookForm } from "../BabyBookForm";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata = { title: "Add Year | Baby Book | Family Nest" };

export default async function NewBabyBookYearPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
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

  // Get existing years so the form can exclude them
  const { data: existingYearRows } = await supabase
    .from("baby_book_years")
    .select("year")
    .eq("family_member_id", memberId)
    .eq("family_id", activeFamilyId);

  const existingYears = (existingYearRows ?? []).map((r) => r.year);
  const displayName = member.nickname || member.name;

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <div className="mb-1 text-sm text-[var(--muted)]">
          <Link href="/dashboard/baby-book" className="hover:text-[var(--foreground)]">
            Baby Books
          </Link>
          {" / "}
          <Link href={`/dashboard/baby-book/${memberId}`} className="hover:text-[var(--foreground)]">
            {displayName}
          </Link>
          {" / "}
          <span>Add year</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">
          Add a year for {displayName}
        </h1>
      </div>

      <BabyBookForm
        memberId={memberId}
        memberName={displayName}
        birthDate={member.birth_date ?? null}
        existingYears={existingYears}
      />
    </div>
  );
}
