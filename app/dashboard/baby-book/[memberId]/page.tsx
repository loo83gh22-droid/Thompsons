import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { ThroughTheYears } from "./ThroughTheYears";

export const metadata = { title: "Baby Book | Family Nest" };

export default async function MemberBabyBookPage({
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
    .select("id, name, nickname, birth_date, avatar_url")
    .eq("id", memberId)
    .eq("family_id", activeFamilyId)
    .single();

  if (!member) notFound();

  const { data: years } = await supabase
    .from("baby_book_years")
    .select(`
      id,
      year,
      note,
      created_at,
      baby_book_photos(id, url, sort_order)
    `)
    .eq("family_id", activeFamilyId)
    .eq("family_member_id", memberId)
    .order("year", { ascending: true });

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
              <Link href={`/dashboard/members/${memberId}`} className="hover:text-[var(--foreground)]">
                {displayName}
              </Link>
            </div>
            <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
              {displayName}&apos;s Baby Book
            </h1>
            <p className="mt-1 text-[var(--muted)]">
              {years?.length ?? 0} {(years?.length ?? 0) === 1 ? "year" : "years"}
              {member.birth_date && (
                <span> &middot; Born {new Date(member.birth_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
              )}
            </p>
          </div>
          <Link
            href={`/dashboard/baby-book/${memberId}/new`}
            className="min-h-[44px] shrink-0 rounded-full bg-[var(--primary)] px-5 py-2 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            + Add year
          </Link>
        </div>
      </div>

      <ThroughTheYears
        years={years ?? []}
        memberId={memberId}
        memberName={displayName}
        birthDate={member.birth_date ?? null}
      />
    </div>
  );
}
