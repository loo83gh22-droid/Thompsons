import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { formatDateOnly } from "@/src/lib/date";
import { thumbUrl } from "@/src/lib/imageUrl";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata = { title: "Member Profile | Family Nest" };

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const { data: member } = await supabase
    .from("family_members")
    .select("id, name, nickname, relationship, contact_email, user_id, birth_date, birth_place, avatar_url, created_at, is_deceased, death_date, is_remembered, passed_date")
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

  // Fetch recent photos, counts, and collection presence in parallel
  const [
    photosRes,
    journalCount,
    voiceCount,
    storyCount,
    recipeCount,
    babyBookCount,
    trophyCount,
    awardCount,
    artworkCount,
  ] = await Promise.all([
    supabase
      .from("journal_photos")
      .select("id, url, caption, entry_id, journal_entries!inner(author_id, family_id)")
      .eq("journal_entries.author_id", id)
      .eq("journal_entries.family_id", activeFamilyId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("author_id", id).eq("family_id", activeFamilyId),
    supabase.from("voice_memos").select("id", { count: "exact", head: true }).eq("family_member_id", id),
    supabase.from("family_stories").select("id", { count: "exact", head: true }).eq("author_family_member_id", id).eq("family_id", activeFamilyId).eq("published", true),
    supabase.from("recipes").select("id", { count: "exact", head: true }).eq("taught_by", id).eq("family_id", activeFamilyId),
    supabase.from("baby_book_years").select("id", { count: "exact", head: true }).eq("family_member_id", id).eq("family_id", activeFamilyId),
    // Trophy case uses award_members junction
    supabase.from("award_members").select("award_id", { count: "exact", head: true }).eq("family_member_id", id),
    supabase.from("award_members").select("award_id", { count: "exact", head: true }).eq("family_member_id", id),
    supabase.from("artwork_pieces").select("id", { count: "exact", head: true }).eq("family_member_id", id).eq("family_id", activeFamilyId),
  ]);

  const photos = (photosRes.data ?? []).map((p) => ({
    id: p.id,
    url: p.url,
    caption: p.caption ?? null,
    entry_id: p.entry_id,
  }));

  const birthdayStr = member.birth_date ? formatDateOnly(member.birth_date) : null;
  const memberSince = member.created_at
    ? new Date(member.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  const displayName = member.nickname?.trim() || member.name;

  function initials(n: string) {
    return n
      .trim()
      .split(/\s+/)
      .map((s) => s[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  // Build collection links — only show ones with content (or always show baby book / trophy case as entry points)
  const collections: { href: string; icon: string; label: string; count: number | null }[] = [
    { href: `/dashboard/baby-book/${id}`, icon: "👶", label: "Baby Book", count: babyBookCount.count },
    { href: `/dashboard/trophy-case/${id}`, icon: "🏆", label: "Trophy Case", count: trophyCount.count },
    { href: `/dashboard/awards/${id}`, icon: "🥇", label: "Awards", count: awardCount.count },
    { href: `/dashboard/artwork/${id}`, icon: "🎨", label: "Artwork", count: artworkCount.count },
    { href: `/dashboard/timeline?member=${id}`, icon: "📅", label: "Timeline", count: null },
  ];

  const contentLinks: { href: string; icon: string; label: string; count: number }[] = [];
  if ((storyCount.count ?? 0) > 0) {
    contentLinks.push({ href: "/dashboard/stories", icon: "📖", label: "Stories", count: storyCount.count ?? 0 });
  }
  if ((recipeCount.count ?? 0) > 0) {
    contentLinks.push({ href: "/dashboard/recipes", icon: "🍽️", label: "Recipes", count: recipeCount.count ?? 0 });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="shrink-0">
          {member.avatar_url ? (
            <img
              src={thumbUrl(member.avatar_url, 300)}
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
              href="/dashboard/our-family"
              className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
            >
              ← Back to family
            </Link>
          </div>
        </div>
      </div>

      {/* Collections hub */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
          {displayName}&apos;s world
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {collections.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-4 text-center transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5"
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="text-xs font-semibold text-[var(--foreground)]">{c.label}</span>
              {c.count !== null && (
                <span className="text-xs text-[var(--muted)]">
                  {c.count} {c.count === 1 ? "item" : "items"}
                </span>
              )}
            </Link>
          ))}
        </div>

        {contentLinks.length > 0 && (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Also contributed</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {contentLinks.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
                >
                  <span>{c.icon}</span>
                  <span>{c.count} {c.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">Stats</h2>
        <div className="mt-3 flex flex-wrap gap-6 text-sm text-[var(--muted)]">
          <Link href={`/dashboard/journal`} className="hover:text-[var(--accent)] hover:underline">
            {journalCount.count ?? 0} journal entries
          </Link>
          <Link href={`/dashboard/voice-memos`} className="hover:text-[var(--accent)] hover:underline">
            {voiceCount.count ?? 0} voice memos
          </Link>
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
                  src={thumbUrl(p.url, 400)}
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
