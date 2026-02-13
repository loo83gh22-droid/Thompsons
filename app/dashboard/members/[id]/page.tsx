import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { formatDateOnly } from "@/src/lib/date";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: member } = await supabase
    .from("family_members")
    .select("id, name, nickname, relationship, contact_email, user_id, birth_date, birth_place, avatar_url, created_at")
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!member) notFound();

  const [entriesRes, voiceRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id, title, trip_date, created_at")
      .eq("author_id", id)
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("voice_memos")
      .select("id, title, created_at")
      .eq("family_member_id", id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const entries = entriesRes.data ?? [];
  const voiceMemos = voiceRes.data ?? [];

  const { data: entryIdsData } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("author_id", id)
    .eq("family_id", activeFamilyId);
  const entryIds = (entryIdsData ?? []).map((e) => e.id);

  let photos: { id: string; url: string; caption: string | null; entry_id: string }[] = [];
  if (entryIds.length > 0) {
    const photosRes = await supabase
      .from("journal_photos")
      .select("id, url, caption, entry_id")
      .in("entry_id", entryIds)
      .order("created_at", { ascending: false })
      .limit(6);
    photos = (photosRes.data ?? []).map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption ?? null,
      entry_id: p.entry_id,
    }));
  }

  const [journalCount, voiceCount] = await Promise.all([
    supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("author_id", id),
    supabase.from("voice_memos").select("id", { count: "exact", head: true }).eq("family_member_id", id),
  ]);

  const birthdayStr = member.birth_date
    ? new Date(member.birth_date + "T12:00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: member.birth_date.slice(0, 4) !== "0000" ? undefined : undefined,
      })
    : null;
  const memberSince = member.created_at
    ? new Date(member.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  function initials(n: string) {
    return n
      .trim()
      .split(/\s+/)
      .map((s) => s[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="shrink-0">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.name}
              loading="lazy"
              className="h-[150px] w-[150px] rounded-full object-cover ring-4 ring-[var(--border)]"
            />
          ) : (
            <div className="flex h-[150px] w-[150px] items-center justify-center rounded-full bg-[var(--accent)]/30 text-4xl font-bold text-[var(--accent)]">
              {initials(member.name)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            {member.name}
          </h1>
          {member.nickname && (
            <p className="mt-1 text-xl text-[var(--muted)]">&quot;{member.nickname}&quot;</p>
          )}
          {member.relationship && (
            <span className="mt-2 inline-block rounded-full bg-[var(--accent)]/20 px-3 py-1 text-sm font-medium text-[var(--accent)]">
              {member.relationship}
            </span>
          )}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
            {birthdayStr && <span>Birthday: {birthdayStr}</span>}
            {member.contact_email && <span>{member.contact_email}</span>}
            {member.user_id ? (
              <span className="text-emerald-500/90">Signed In</span>
            ) : (
              <span className="text-amber-500/90">Pending Invitation</span>
            )}
          </div>
          <div className="mt-4">
            <Link
              href="/dashboard/members"
              className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
            >
              Edit profile
            </Link>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">Stats</h2>
        <div className="mt-3 flex flex-wrap gap-6 text-sm text-[var(--muted)]">
          <span>{journalCount.count ?? 0} journal entries</span>
          <span>{voiceCount.count ?? 0} voice memos</span>
          {memberSince && <span>Member since {memberSince}</span>}
        </div>
      </section>

      {photos.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
            Recent photos
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/journal/${p.entry_id}`}
                className="block overflow-hidden rounded-lg bg-[var(--background)] aspect-square"
              >
                <img
                  src={p.url}
                  alt={p.caption || `Photo by ${member.name}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {entries.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
            Recent journal entries
          </h2>
          <ul className="mt-4 space-y-2">
            {entries.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/dashboard/journal/${e.id}`}
                  className="font-medium text-[var(--accent)] hover:underline"
                >
                  {e.title}
                </Link>
                <span className="ml-2 text-sm text-[var(--muted)]">
                  {e.trip_date ? formatDateOnly(e.trip_date) : formatDateOnly(e.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {voiceMemos.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
            Recent voice memos
          </h2>
          <ul className="mt-4 space-y-2">
            {voiceMemos.map((vm) => (
              <li key={vm.id}>
                <Link
                  href="/dashboard/voice-memos"
                  className="font-medium text-[var(--accent)] hover:underline"
                >
                  {vm.title}
                </Link>
                <span className="ml-2 text-sm text-[var(--muted)]">
                  {formatDateOnly(vm.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center">
        <Link
          href="/dashboard/members"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Back to members
        </Link>
      </p>
    </div>
  );
}
