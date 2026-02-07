import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddTimeCapsuleForm } from "./AddTimeCapsuleForm";
import { formatDateOnly } from "@/src/lib/date";

export default async function TimeCapsulesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId || !user) return null;

  const { data: myMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  const sent = myMember
    ? (await supabase
        .from("time_capsules")
        .select("id, title, unlock_date, to_family_member:family_members!to_family_member_id(name)")
        .eq("family_id", activeFamilyId)
        .eq("from_family_member_id", myMember.id)
        .order("unlock_date", { ascending: true })).data ?? []
    : [];

  const received = myMember
    ? (await supabase
        .from("time_capsules")
        .select("id, title, unlock_date, from_family_member:family_members!from_family_member_id(name)")
        .eq("family_id", activeFamilyId)
        .eq("to_family_member_id", myMember.id)
        .order("unlock_date", { ascending: true })).data ?? []
    : [];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Time Capsules
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Write letters to future versions of family members. Seal them until a date — like &quot;Read this when you turn 18.&quot;
          </p>
        </div>
        <AddTimeCapsuleForm />
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
            Letters for you
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Letters others have written for you. They unlock on the date set.
          </p>
          <div className="mt-4 space-y-3">
            {!received.length ? (
              <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] py-8 text-center text-[var(--muted)]">
                No letters for you yet.
              </p>
            ) : (
              received.map((letter) => {
                const raw = letter.from_family_member as { name: string } | { name: string }[] | null;
                const from = Array.isArray(raw) ? raw[0] : raw;
                const unlocked = letter.unlock_date <= today;
                return (
                  <Link
                    key={letter.id}
                    href={`/dashboard/time-capsules/${letter.id}`}
                    className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-[var(--foreground)]">{letter.title}</span>
                        {from?.name && (
                          <span className="ml-2 text-sm text-[var(--muted)]">
                            from {from.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            unlocked ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {unlocked ? "Unlocked" : `Sealed until ${formatDateOnly(letter.unlock_date)}`}
                        </span>
                        <span className="text-[var(--muted)]">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
            Letters you&apos;ve written
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Letters you&apos;ve sealed for family members.
          </p>
          <div className="mt-4 space-y-3">
            {!sent.length ? (
              <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] py-8 text-center text-[var(--muted)]">
                You haven&apos;t written any letters yet. Click &quot;Write a letter&quot; to get started.
              </p>
            ) : (
              sent.map((letter) => {
                const raw = letter.to_family_member as { name: string } | { name: string }[] | null;
                const to = Array.isArray(raw) ? raw[0] : raw;
                const unlocked = letter.unlock_date <= today;
                return (
                  <Link
                    key={letter.id}
                    href={`/dashboard/time-capsules/${letter.id}`}
                    className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-[var(--foreground)]">{letter.title}</span>
                        {to?.name && (
                          <span className="ml-2 text-sm text-[var(--muted)]">
                            for {to.name}
                          </span>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          unlocked ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {unlocked ? "Unlocked" : `Sealed until ${formatDateOnly(letter.unlock_date)}`}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
