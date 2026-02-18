import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { notFound } from "next/navigation";
import { formatDateOnly } from "@/src/lib/date";
import { DeleteTimeCapsuleButton } from "../DeleteTimeCapsuleButton";
import { WaxSeal, nameToInitials } from "../WaxSeal";

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
              {/* Large envelope with wax seal */}
              <div className="relative inline-block">
                <svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="2" y="2" width="116" height="86" rx="6" fill="#fef3c7" stroke="#d97706" strokeWidth="2"/>
                  <path d="M2 8L60 52L118 8" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M2 88L38 54" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                  <path d="M118 88L82 54" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                </svg>
                {/* Wax seal centred on the envelope */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3">
                  <WaxSeal
                    initials={from?.name ? nameToInitials(from.name) : "?"}
                    size={64}
                  />
                </div>
              </div>

              <h1 className="mt-10 font-display text-2xl font-bold text-[var(--foreground)]">
                {letter.title}
              </h1>
              <p className="mt-2 text-[var(--muted)]">
                This letter is sealed until{" "}
                <span className="font-semibold text-amber-600">{formatDateOnly(letter.unlock_date)}</span>.
              </p>
              {from?.name && (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Sealed with love by {from.name}
                </p>
              )}
              <p className="mt-6 max-w-xs text-sm text-[var(--muted)] italic leading-relaxed">
                &ldquo;Some things are worth waiting for. Come back on that date and it will open for you.&rdquo;
              </p>
              <DeleteTimeCapsuleButton id={letter.id} className="mt-8" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
