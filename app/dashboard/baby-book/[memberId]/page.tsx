import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { BirthDetailsCard } from "./BirthDetailsCard";
import { MonthGrid } from "./MonthGrid";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata = { title: "Baby Book | Family Nest" };

export default async function MemberBabyBookPage({
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
    .select("id, name, nickname, birth_date, avatar_url")
    .eq("id", memberId)
    .eq("family_id", activeFamilyId)
    .single();

  if (!member) notFound();

  // Fetch all existing monthly entries for this member
  const { data: entries } = await supabase
    .from("baby_book_months")
    .select("id, entry_month, photo_url, photo_path, photo_size_bytes, story")
    .eq("family_id", activeFamilyId)
    .eq("member_id", memberId)
    .order("entry_month", { ascending: true });

  const { data: birthProfile } = await supabase
    .from("baby_book_profiles")
    .select("id, birth_time, birth_weight, birth_length, birth_place, birth_story")
    .eq("family_member_id", memberId)
    .eq("family_id", activeFamilyId)
    .maybeSingle();

  const displayName = member.nickname || member.name;

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-sm text-[var(--muted)]">
              <Link href="/dashboard/baby-book" className="hover:text-[var(--foreground)]">
                Baby Books
              </Link>
              {" / "}
              <span className="text-[var(--foreground)]">{displayName}</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
              {displayName}&apos;s Baby Book
            </h1>
            {member.birth_date && (
              <p className="mt-1 text-sm text-[var(--muted)]">
                Born{" "}
                {new Date(member.birth_date + "T12:00:00").toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {" "}· {entries?.length ?? 0} {(entries?.length ?? 0) === 1 ? "month" : "months"} captured
              </p>
            )}
          </div>
        </div>
      </div>

      <BirthDetailsCard
        memberId={memberId}
        memberName={displayName}
        profile={birthProfile ?? null}
      />

      <MonthGrid
        memberId={memberId}
        memberName={displayName}
        birthDate={member.birth_date ?? null}
        entries={entries ?? []}
      />
    </div>
  );
}
