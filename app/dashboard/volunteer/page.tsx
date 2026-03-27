import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";

export const metadata: Metadata = { title: "Volunteer Log | Family Nest" };

export default async function VolunteerPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: entries } = await supabase
    .from("volunteer_entries")
    .select("id, organization, date, hours, description, cause_tags, city, cover_photo_path, cover_photo_bucket, volunteer_entry_members(member_id, family_members!member_id(id, name, nickname, color))")
    .eq("family_id", activeFamilyId)
    .order("date", { ascending: false });

  // Total hours
  const totalHours = (entries ?? []).reduce((sum, e) => sum + (e.hours ?? 0), 0);

  type MemberJoin = { id: string; name: string; nickname: string | null; color: string | null } | { id: string; name: string; nickname: string | null; color: string | null }[] | null;
  type RawEntryMember = { member_id: string; family_members: MemberJoin };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Volunteer Log</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Giving back together.
            {totalHours > 0 && (
              <span className="ml-1 font-medium text-[var(--accent)]">{totalHours.toLocaleString()} hours logged.</span>
            )}
          </p>
        </div>
        <Link href="/dashboard/volunteer/new" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          + Log entry
        </Link>
      </div>

      {(!entries || entries.length === 0) && (
        <div className="mt-20 text-center">
          <div className="text-5xl">🤝</div>
          <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">No entries yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-sm mx-auto">
            Document the causes your family cares about and the time you&apos;ve given.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/dashboard/volunteer/new" className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90">
              + Log your first entry
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {(entries ?? []).map(entry => {
          const rawMembers = (entry.volunteer_entry_members ?? []) as unknown as RawEntryMember[];
          const members = rawMembers.map(em => {
            const m = Array.isArray(em.family_members) ? em.family_members[0] : em.family_members;
            return m;
          }).filter(Boolean) as { id: string; name: string; nickname: string | null; color: string | null }[];

          const coverSrc = entry.cover_photo_path
            ? `/api/storage/volunteer-photos/${entry.cover_photo_path}`
            : null;

          return (
            <Link
              key={entry.id}
              href={`/dashboard/volunteer/${entry.id}`}
              className="group flex gap-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)] hover:shadow-sm"
            >
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-[var(--surface)]">
                {coverSrc ? (
                  <Image src={coverSrc} alt={entry.organization} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">🤝</div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center gap-1 min-w-0">
                <h2 className="font-display text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] truncate">
                  {entry.organization}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                  <span>{new Date(entry.date).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })}</span>
                  {entry.hours && <span>· {entry.hours}h</span>}
                  {entry.city && <span>· {entry.city}</span>}
                </div>
                {entry.cause_tags && entry.cause_tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {entry.cause_tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--muted)]">{tag}</span>
                    ))}
                  </div>
                )}
                {members.length > 0 && (
                  <div className="mt-1 flex -space-x-1.5">
                    {members.slice(0, 5).map(m => (
                      <span key={m.id} className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-[var(--card)]" style={{ backgroundColor: m.color ?? "var(--accent)" }}>
                        {(m.nickname ?? m.name).charAt(0).toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
