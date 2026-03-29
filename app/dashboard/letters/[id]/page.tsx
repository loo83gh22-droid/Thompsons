import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { DeleteLetterButton } from "./DeleteLetterButton";

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

export default async function LetterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: raw } = await supabase
    .from("family_letters")
    .select("*, from_member:family_members!from_member_id(id, name, color), to_member:family_members!to_member_id(id, name, color, birth_date)")
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!raw) notFound();

  const letter = raw as unknown as Letter;
  const toName = letter.to_member?.name ?? "Someone";
  const fromName = letter.from_member?.name ?? "Someone";
  const toColor = letter.to_member?.color ?? "#aaa";

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/letters"
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Back to letters
      </Link>

      {/* Sealed banner */}
      {letter.deliver_at_age && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          🔒 Sealed until {toName} turns {letter.deliver_at_age}
        </div>
      )}

      {/* Header */}
      <div className="mt-5 flex items-center gap-3">
        <span
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: toColor }}
        />
        <h1 className="font-display text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
          {letter.title ?? `A letter to ${toName}`}
        </h1>
      </div>

      <p className="mt-2 text-sm text-[var(--muted)]">
        Written on {formatDate(letter.written_on)}
      </p>

      {/* Body */}
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-7 sm:px-8 sm:py-9">
        <p className="whitespace-pre-wrap text-lg leading-relaxed text-[var(--foreground)]">
          {letter.body}
        </p>
      </div>

      {/* Attribution */}
      <p className="mt-4 text-sm text-[var(--muted)]">
        Written by {fromName} &middot; {formatDate(letter.written_on)}
      </p>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        <Link
          href={`/dashboard/letters/${letter.id}/edit`}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
        >
          Edit
        </Link>
        <DeleteLetterButton letterId={letter.id} />
      </div>
    </div>
  );
}
