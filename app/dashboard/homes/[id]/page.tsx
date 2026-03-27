import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { HomeDetailClient } from "./HomeDetailClient";

export const metadata: Metadata = { title: "Home | Family Nest" };

type Props = { params: Promise<{ id: string }> };

export default async function HomeDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: { user } } = await supabase.auth.getUser();

  const [homeRes, photosRes, membersRes, myMemberRes] = await Promise.all([
    supabase
      .from("family_homes")
      .select("id, address, city, from_year, to_year, notes, cover_photo_path, cover_photo_bucket, family_home_members(member_id, family_members!member_id(id, name, nickname, color))")
      .eq("id", id)
      .eq("family_id", activeFamilyId)
      .single(),
    supabase
      .from("family_home_photos")
      .select("id, storage_path, bucket")
      .eq("home_id", id)
      .eq("family_id", activeFamilyId)
      .order("created_at"),
    supabase
      .from("family_members")
      .select("id, name, nickname, color")
      .eq("family_id", activeFamilyId)
      .eq("is_remembered", false)
      .order("name"),
    user
      ? supabase.from("family_members").select("id, role").eq("user_id", user.id).eq("family_id", activeFamilyId).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!homeRes.data) notFound();

  const home = homeRes.data;
  type MemberJoin = { id: string; name: string; nickname: string | null; color: string | null } | { id: string; name: string; nickname: string | null; color: string | null }[] | null;
  type RawHomeMember = { member_id: string; family_members: MemberJoin };

  const homeMembers = ((home.family_home_members ?? []) as unknown as RawHomeMember[]).map(hm => {
    const m = Array.isArray(hm.family_members) ? hm.family_members[0] : hm.family_members;
    return m;
  }).filter(Boolean) as { id: string; name: string; nickname: string | null; color: string | null }[];

  const photos = (photosRes.data ?? []).map(p => ({
    id: p.id,
    src: `/api/storage/home-photos/${p.storage_path}`,
    storagePath: p.storage_path,
  }));

  const isCurrent = !home.to_year;
  const yearRange = home.from_year
    ? `${home.from_year} – ${home.to_year ?? "Present"}`
    : home.to_year ? `Until ${home.to_year}` : null;

  const coverSrc = home.cover_photo_path
    ? `/api/storage/home-photos/${home.cover_photo_path}`
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/dashboard/homes" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Our Homes
      </Link>

      {/* Hero */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        {coverSrc && (
          <div className="relative h-56 w-full">
            <Image src={coverSrc} alt="Home cover" fill className="object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">
                  {home.address ?? home.city ?? "Unnamed home"}
                </h1>
                {isCurrent && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Current
                  </span>
                )}
              </div>
              {home.city && home.address && (
                <p className="mt-1 text-sm text-[var(--muted)]">{home.city}</p>
              )}
              {yearRange && <p className="text-sm text-[var(--muted)]">{yearRange}</p>}
              {homeMembers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {homeMembers.map(m => (
                    <span
                      key={m.id}
                      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: m.color ?? "var(--accent)" }}
                    >
                      {m.nickname ?? m.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Link href={`/dashboard/homes/${id}/edit`} className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface)]">
              Edit
            </Link>
          </div>
          {home.notes && (
            <p className="mt-4 whitespace-pre-wrap text-sm text-[var(--foreground)]">{home.notes}</p>
          )}
        </div>
      </div>

      {/* Photos */}
      <HomeDetailClient
        homeId={id}
        photos={photos}
        coverPath={home.cover_photo_path ?? null}
        myRole={myMemberRes.data?.role ?? "teen"}
        myMemberId={myMemberRes.data?.id ?? null}
      />
    </div>
  );
}
