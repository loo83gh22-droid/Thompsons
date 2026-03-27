import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { VolunteerDetailClient } from "./VolunteerDetailClient";

export const metadata: Metadata = { title: "Volunteer Entry | Family Nest" };

type Props = { params: Promise<{ id: string }> };

export default async function VolunteerDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: { user } } = await supabase.auth.getUser();

  const [entryRes, photosRes, myMemberRes] = await Promise.all([
    supabase
      .from("volunteer_entries")
      .select("id, organization, date, hours, description, cause_tags, city, cover_photo_path, volunteer_entry_members(member_id, family_members!member_id(id, name, nickname, color))")
      .eq("id", id)
      .eq("family_id", activeFamilyId)
      .single(),
    supabase
      .from("volunteer_photos")
      .select("id, storage_path")
      .eq("entry_id", id)
      .eq("family_id", activeFamilyId)
      .order("created_at"),
    user
      ? supabase.from("family_members").select("id, role").eq("user_id", user.id).eq("family_id", activeFamilyId).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!entryRes.data) notFound();

  const entry = entryRes.data;
  type MemberJoin = { id: string; name: string; nickname: string | null; color: string | null } | { id: string; name: string; nickname: string | null; color: string | null }[] | null;
  type RawEM = { member_id: string; family_members: MemberJoin };

  const members = ((entry.volunteer_entry_members ?? []) as unknown as RawEM[]).map(em => {
    const m = Array.isArray(em.family_members) ? em.family_members[0] : em.family_members;
    return m;
  }).filter(Boolean) as { id: string; name: string; nickname: string | null; color: string | null }[];

  const photos = (photosRes.data ?? []).map(p => ({
    id: p.id,
    src: `/api/storage/volunteer-photos/${p.storage_path}`,
    storagePath: p.storage_path,
  }));

  const coverSrc = entry.cover_photo_path ? `/api/storage/volunteer-photos/${entry.cover_photo_path}` : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/dashboard/volunteer" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Volunteer Log
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        {coverSrc && (
          <div className="relative h-48 w-full">
            <Image src={coverSrc} alt={entry.organization} fill className="object-cover" />
          </div>
        )}
        <div className="p-6">
          <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">{entry.organization}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            <span>{new Date(entry.date).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</span>
            {entry.hours && <span>· {entry.hours} hours</span>}
            {entry.city && <span>· {entry.city}</span>}
          </div>
          {entry.cause_tags && entry.cause_tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(entry.cause_tags as string[]).map(tag => (
                <span key={tag} className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--muted)]">{tag}</span>
              ))}
            </div>
          )}
          {members.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {members.map(m => (
                <span key={m.id} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: m.color ?? "var(--accent)" }}>
                  {m.nickname ?? m.name}
                </span>
              ))}
            </div>
          )}
          {entry.description && (
            <p className="mt-4 whitespace-pre-wrap text-sm text-[var(--foreground)]">{entry.description}</p>
          )}
        </div>
      </div>

      <VolunteerDetailClient
        entryId={id}
        photos={photos}
        coverPath={entry.cover_photo_path ?? null}
        myRole={myMemberRes.data?.role ?? "teen"}
      />
    </div>
  );
}
