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

  // Letters the current user SENT
  const sent = myMember
    ? (await supabase
        .from("time_capsules")
        .select("id, title, unlock_date, unlock_on_passing, to_family_member:family_members!to_family_member_id(name)")
        .eq("family_id", activeFamilyId)
        .eq("from_family_member_id", myMember.id)
        .order("unlock_date", { ascending: true })).data ?? []
    : [];

  // Letters addressed TO the current user (legacy FK)
  const receivedLegacy = myMember
    ? (await supabase
        .from("time_capsules")
        .select("id, title, unlock_date, unlock_on_passing, from_family_member_id, from_family_member:family_members!from_family_member_id(name)")
        .eq("family_id", activeFamilyId)
        .eq("to_family_member_id", myMember.id)
        .order("unlock_date", { ascending: true })).data ?? []
    : [];

  // Letters where current user is in the junction table
  const receivedJunction = myMember
    ? (await supabase
        .from("time_capsule_members")
        .select("time_capsule_id")
        .eq("family_member_id", myMember.id)).data ?? []
    : [];

  const junctionIds = receivedJunction.map((r) => r.time_capsule_id);

  // Fetch junction capsules that aren't already in legacy list
  const legacyIds = new Set(receivedLegacy.map((r) => r.id));
  const extraJunctionIds = junctionIds.filter((id) => !legacyIds.has(id));

  let receivedFromJunction: typeof receivedLegacy = [];
  if (extraJunctionIds.length > 0) {
    const { data } = await supabase
      .from("time_capsules")
      .select("id, title, unlock_date, unlock_on_passing, from_family_member_id, from_family_member:family_members!from_family_member_id(name)")
      .eq("family_id", activeFamilyId)
      .in("id", extraJunctionIds)
      .order("unlock_date", { ascending: true });
    receivedFromJunction = data ?? [];
  }

  const received = [...receivedLegacy, ...receivedFromJunction];

  // Check passing status for senders who have unlock_on_passing capsules
  const senderIdsToCheck = new Set<string>();
  for (const r of [...sent, ...received]) {
    if (r.unlock_on_passing && "from_family_member_id" in r && r.from_family_member_id) {
      senderIdsToCheck.add(r.from_family_member_id);
    }
  }

  const passedSenders = new Set<string>();
  if (senderIdsToCheck.size > 0) {
    const { data: senders } = await supabase
      .from("family_members")
      .select("id, is_remembered")
      .in("id", Array.from(senderIdsToCheck));
    for (const s of senders ?? []) {
      if (s.is_remembered) passedSenders.add(s.id);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  function isUnlocked(letter: { unlock_date: string; unlock_on_passing: boolean; from_family_member_id?: string }) {
    const dateUnlocked = letter.unlock_date <= today;
    const passingUnlocked = letter.unlock_on_passing && letter.from_family_member_id && passedSenders.has(letter.from_family_member_id);
    return dateUnlocked || !!passingUnlocked;
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Time Capsules
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Write letters to future versions of family members. Seal them until a date — like &quot;Read this when you turn 18.&quot;
          </p>
        </div>
        <div className="shrink-0">
          <AddTimeCapsuleForm />
        </div>
      </div>

      <div className="space-y-12">
        {/* ── Letters for you ── */}
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
                const unlocked = isUnlocked(letter);
                return (
                  <Link
                    key={letter.id}
                    href={`/dashboard/time-capsules/${letter.id}`}
                    className={`group block overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md ${
                      unlocked
                        ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 hover:bg-emerald-50"
                        : "border-amber-200/70 hover:border-amber-300 hover:shadow-amber-100/60"
                    }`}
                    style={!unlocked ? { background: "linear-gradient(105deg, #fdf6e3 0%, #f5e8cc 100%)" } : undefined}
                  >
                    <div className="flex items-stretch gap-0">
                      {/* Left visual panel */}
                      {unlocked ? (
                        <div className="flex w-20 shrink-0 items-center justify-center bg-emerald-100/60 border-r border-emerald-200 py-5">
                          <span className="text-3xl">💌</span>
                        </div>
                      ) : (
                        <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-0 border-r border-amber-200/60 py-5"
                          style={{ background: "linear-gradient(160deg, #fef3c7 0%, #fde68a33 100%)" }}
                        >
                          <div className="relative">
                            <svg width="44" height="32" viewBox="0 0 80 58" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              <rect x="1" y="1" width="78" height="56" rx="4" fill="#fef9ee" stroke="#c49a4a" strokeWidth="2" />
                              <path d="M1 5L40 32L79 5" stroke="#c49a4a" strokeWidth="2" strokeLinecap="round" />
                              <path d="M1 57L28 35" stroke="#c49a4a" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
                              <path d="M79 57L52 35" stroke="#c49a4a" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
                            </svg>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                              <WaxSeal
                                initials={from?.name ? nameToInitials(from.name) : "?"}
                                size={28}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 px-4 py-3.5">
                        <div className="min-w-0">
                          <span className="font-semibold text-[var(--foreground)]">{letter.title}</span>
                          {from?.name && (
                            <span className="ml-2 text-sm text-[var(--muted)]">from {from.name}</span>
                          )}
                          {!unlocked && (
                            <p className="mt-0.5 text-xs italic text-[var(--muted)]">
                              {letter.unlock_on_passing
                                ? "A letter kept safe, to be opened when the time comes…"
                                : "A letter waits patiently for its day…"}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                            unlocked
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {unlocked
                            ? "✉️ Unlocked"
                            : letter.unlock_on_passing
                            ? "🕊️ Sealed until passing"
                            : `🔒 Opens ${formatDateOnly(letter.unlock_date)}`}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* ── Letters you've written ── */}
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
                    className={`group block overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md ${
                      unlocked
                        ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 hover:bg-emerald-50"
                        : "border-amber-200/70 hover:border-amber-300 hover:shadow-amber-100/60"
                    }`}
                    style={!unlocked ? { background: "linear-gradient(105deg, #fdf6e3 0%, #f5e8cc 100%)" } : undefined}
                  >
                    <div className="flex items-stretch gap-0">
                      {/* Left visual panel */}
                      {unlocked ? (
                        <div className="flex w-20 shrink-0 items-center justify-center bg-emerald-100/60 border-r border-emerald-200 py-5">
                          <span className="text-3xl">📬</span>
                        </div>
                      ) : (
                        <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-0 border-r border-amber-200/60 py-5"
                          style={{ background: "linear-gradient(160deg, #fef3c7 0%, #fde68a33 100%)" }}
                        >
                          <div className="relative">
                            <svg width="44" height="32" viewBox="0 0 80 58" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              <rect x="1" y="1" width="78" height="56" rx="4" fill="#fef9ee" stroke="#c49a4a" strokeWidth="2" />
                              <path d="M1 5L40 32L79 5" stroke="#c49a4a" strokeWidth="2" strokeLinecap="round" />
                              <path d="M1 57L28 35" stroke="#c49a4a" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
                              <path d="M79 57L52 35" stroke="#c49a4a" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
                            </svg>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                              <WaxSeal
                                initials="ME"
                                size={28}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 px-4 py-3.5">
                        <div className="min-w-0">
                          <span className="font-semibold text-[var(--foreground)]">{letter.title}</span>
                          {to?.name && (
                            <span className="ml-2 text-sm text-[var(--muted)]">for {to.name}</span>
                          )}
                          {!unlocked && (
                            <p className="mt-0.5 text-xs italic text-[var(--muted)]">
                              {letter.unlock_on_passing
                                ? "Your words, kept safe for when the time comes."
                                : `Your words, kept safe until ${formatDateOnly(letter.unlock_date)}.`}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                            unlocked
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {unlocked
                            ? "✉️ Unlocked"
                            : letter.unlock_on_passing
                            ? "🕊️ Opens when you pass"
                            : `🔒 Opens ${formatDateOnly(letter.unlock_date)}`}
                        </span>
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
