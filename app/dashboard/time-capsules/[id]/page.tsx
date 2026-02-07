import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { notFound } from "next/navigation";
import { formatDateOnly } from "@/src/lib/date";
import { DeleteTimeCapsuleButton } from "../DeleteTimeCapsuleButton";

export default async function TimeCapsulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId || !user) return null;

  const { data: letter } = await supabase
    .from("time_capsules")
    .select(`
      id,
      title,
      content,
      unlock_date,
      from_family_member:family_members!from_family_member_id(name),
      to_family_member:family_members!to_family_member_id(name)
    `)
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!letter) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const unlocked = letter.unlock_date <= today;

  const rawFrom = letter.from_family_member as { name: string } | { name: string }[] | null;
  const rawTo = letter.to_family_member as { name: string } | { name: string }[] | null;
  const from = Array.isArray(rawFrom) ? rawFrom[0] : rawFrom;
  const to = Array.isArray(rawTo) ? rawTo[0] : rawTo;

  return (
    <div>
      <Link
        href="/dashboard/time-capsules"
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Back to Time Capsules
      </Link>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">
        {unlocked ? (
          <>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">
                  {letter.title}
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {from?.name && `From ${from.name}`}
                  {to?.name && from?.name && " · "}
                  {to?.name && `For ${to.name}`}
                  {letter.unlock_date && ` · Unlocked ${formatDateOnly(letter.unlock_date)}`}
                </p>
              </div>
              <DeleteTimeCapsuleButton id={letter.id} />
            </div>
            <div className="whitespace-pre-wrap text-[var(--foreground)]">
              {letter.content}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center py-12 text-center">
              <span className="text-6xl">🔒</span>
              <h1 className="mt-4 font-display text-2xl font-bold text-[var(--foreground)]">
                {letter.title}
              </h1>
              <p className="mt-2 text-[var(--muted)]">
                This letter is sealed until {formatDateOnly(letter.unlock_date)}.
              </p>
              {from?.name && (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  From {from.name}
                </p>
              )}
              <p className="mt-6 text-sm text-[var(--muted)]">
                Come back on or after that date to read it.
              </p>
              <DeleteTimeCapsuleButton id={letter.id} className="mt-8" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
