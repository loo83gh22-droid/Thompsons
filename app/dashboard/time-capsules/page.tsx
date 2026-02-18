import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddTimeCapsuleForm } from "./AddTimeCapsuleForm";
import { TimeCapsuleSentEmpty } from "./TimeCapsuleEmptyState";
import { EmptyState } from "@/app/dashboard/components/EmptyState";
import { formatDateOnly } from "@/src/lib/date";
import { WaxSeal, nameToInitials } from "./WaxSeal";

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
              <EmptyState
                icon="💌"
                headline="No letters for you yet"
                description="When family members write you a letter for the future, it will appear here and unlock on the date they set."
              />
            ) : (
              received.map((letter) => {
                const raw = letter.from_family_member as { name: string } | { name: string }[] | null;
                const from = Array.isArray(raw) ? raw[0] : raw;
                const unlocked = letter.unlock_date <= today;
                return (
                  <Link
                    key={letter.id}
                    href={`/dashboard/time-capsules/${letter.id}`}
                    className={`group block rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
                      unlocked
                        ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 hover:bg-emerald-50"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Wax seal or open envelope */}
                      {unlocked ? (
                        <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-3xl">
                          💌
                        </span>
                      ) : (
                        <div className="relative flex-shrink-0">
                          {/* Envelope body */}
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-amber-50 border border-amber-200">
                            <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              {/* Envelope outline */}
                              <rect x="1" y="1" width="30" height="22" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5"/>
                              {/* Flap fold lines */}
                              <path d="M1 3L16 14L31 3" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </div>
                          {/* Wax seal overlaid on envelope */}
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                            <WaxSeal
                              initials={from?.name ? nameToInitials(from.name) : "?"}
                              size={32}
                            />
                          </div>
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <span className="font-medium text-[var(--foreground)]">{letter.title}</span>
                            {from?.name && (
                              <span className="ml-2 text-sm text-[var(--muted)]">
                                from {from.name}
                              </span>
                            )}
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                              unlocked
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {unlocked ? "✉️ Unlocked" : `🔒 Sealed until ${formatDateOnly(letter.unlock_date)}`}
                          </span>
                        </div>
                        {!unlocked && (
                          <p className="mt-1 text-xs text-[var(--muted)] italic">
                            A letter waits patiently for its day…
                          </p>
                        )}
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
              <TimeCapsuleSentEmpty />
            ) : (
              sent.map((letter) => {
                const raw = letter.to_family_member as { name: string } | { name: string }[] | null;
                const to = Array.isArray(raw) ? raw[0] : raw;
                const unlocked = letter.unlock_date <= today;
                return (
                  <Link
                    key={letter.id}
                    href={`/dashboard/time-capsules/${letter.id}`}
                    className={`group block rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
                      unlocked
                        ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 hover:bg-emerald-50"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Wax seal or open envelope */}
                      {unlocked ? (
                        <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-3xl">
                          📬
                        </span>
                      ) : (
                        <div className="relative flex-shrink-0">
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-amber-50 border border-amber-200">
                            <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              <rect x="1" y="1" width="30" height="22" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5"/>
                              <path d="M1 3L16 14L31 3" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                            <WaxSeal
                              initials={myMember ? "ME" : "?"}
                              size={32}
                            />
                          </div>
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <span className="font-medium text-[var(--foreground)]">{letter.title}</span>
                            {to?.name && (
                              <span className="ml-2 text-sm text-[var(--muted)]">
                                for {to.name}
                              </span>
                            )}
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                              unlocked
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {unlocked ? "✉️ Unlocked" : `🔒 Sealed until ${formatDateOnly(letter.unlock_date)}`}
                          </span>
                        </div>
                        {!unlocked && (
                          <p className="mt-1 text-xs text-[var(--muted)] italic">
                            Your words, kept safe until {formatDateOnly(letter.unlock_date)}.
                          </p>
                        )}
                      </div>
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
