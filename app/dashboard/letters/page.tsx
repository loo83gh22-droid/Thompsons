import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";

export const metadata = { title: "Letters | Family Nest" };

type MemberRef = { id: string; name: string; color: string | null };

type Letter = {
  id: string;
  title: string | null;
  body: string;
  written_on: string;
  deliver_at_age: number | null;
  from_member_id: string | null;
  to_member_id: string | null;
  from_member: MemberRef | null;
  to_member: (MemberRef & { birth_date: string | null }) | null;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function ColorDot({ color }: { color: string | null }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
      style={{ backgroundColor: color ?? "#aaa" }}
    />
  );
}

function LetterCard({ letter, showTo }: { letter: Letter; showTo: boolean }) {
  const person = showTo ? letter.to_member : letter.from_member;
  const personLabel = showTo
    ? (letter.to_member?.name ?? "Someone")
    : (letter.from_member?.name ?? "Someone");

  const preview = letter.title ?? letter.body.slice(0, 80) + (letter.body.length > 80 ? "…" : "");

  return (
    <Link
      href={`/dashboard/letters/${letter.id}`}
      className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-hover)]"
    >
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <ColorDot color={person?.color ?? null} />
        <span>{showTo ? "To" : "From"} {personLabel}</span>
        <span className="ml-auto shrink-0">{formatDate(letter.written_on)}</span>
      </div>
      <p className="text-sm text-[var(--foreground)] leading-snug">{preview}</p>
      {letter.deliver_at_age && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          🔒 Sealed until age {letter.deliver_at_age}
        </span>
      )}
    </Link>
  );
}

export default async function LettersPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: currentMember } = await supabase
    .from("family_members")
    .select("id, name")
    .eq("family_id", activeFamilyId)
    .eq("user_id", user.id)
    .single();

  const { data: rawLetters } = await supabase
    .from("family_letters")
    .select("*, from_member:family_members!from_member_id(id, name, color), to_member:family_members!to_member_id(id, name, color, birth_date)")
    .eq("family_id", activeFamilyId)
    .order("written_on", { ascending: false });

  const letters = (rawLetters ?? []) as unknown as Letter[];

  const writtenByMe = letters.filter((l) => l.from_member_id === currentMember?.id);
  const writtenToMe = letters.filter((l) => l.to_member_id === currentMember?.id);

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
            📝 Letters
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Personal letters, addressed to someone you love.
          </p>
        </div>
        <Link
          href="/dashboard/letters/new"
          className="shrink-0 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
        >
          Write a letter
        </Link>
      </div>

      {/* Private badge */}
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">
        🔒 Private to your nest — never shared
      </div>

      {letters.length === 0 ? (
        <div className="mt-12 text-center text-[var(--muted)]">
          <p className="text-4xl">✉️</p>
          <p className="mt-3 text-base font-medium text-[var(--foreground)]">No letters yet.</p>
          <p className="mt-1 text-sm">Start writing — these are the ones that last.</p>
          <Link
            href="/dashboard/letters/new"
            className="mt-4 inline-flex rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            Write your first letter
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {/* Written by me */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">
              Written by me
            </h2>
            {writtenByMe.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                You haven&apos;t written any letters yet.{" "}
                <Link href="/dashboard/letters/new" className="text-[var(--accent)] hover:underline">
                  Write one now.
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {writtenByMe.map((l) => (
                  <LetterCard key={l.id} letter={l} showTo={true} />
                ))}
              </div>
            )}
          </section>

          {/* Written to me */}
          {writtenToMe.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">
                Written to me
              </h2>
              <div className="space-y-3">
                {writtenToMe.map((l) => (
                  <LetterCard key={l.id} letter={l} showTo={false} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
