import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata: Metadata = { title: "Our Homes | Family Nest" };

export default async function HomesPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const { data: homes } = await supabase
    .from("family_homes")
    .select("id, address, city, from_year, to_year, notes, cover_photo_path, cover_photo_bucket, family_home_members(member_id, family_members!member_id(id, name, nickname, color))")
    .eq("family_id", activeFamilyId)
    .order("from_year", { ascending: false, nullsFirst: true });

  type MemberJoin = { id: string; name: string; nickname: string | null; color: string | null } | { id: string; name: string; nickname: string | null; color: string | null }[] | null;
  type RawHomeMember = { member_id: string; family_members: MemberJoin };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Our Homes</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Every place your family has called home.</p>
        </div>
        <Link
          href="/dashboard/homes/new"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Add home
        </Link>
      </div>

      {(!homes || homes.length === 0) && (
        <div className="mt-20 text-center">
          <div className="text-5xl">🏡</div>
          <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">No homes yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-sm mx-auto">
            Add every place your family has lived — from childhood homes to where you are now.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/dashboard/homes/new" className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90">
              + Add your first home
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {(homes ?? []).map(home => {
          const rawMembers = (home.family_home_members ?? []) as unknown as RawHomeMember[];
          const members = rawMembers.map(hm => {
            const m = Array.isArray(hm.family_members) ? hm.family_members[0] : hm.family_members;
            return m;
          }).filter(Boolean) as { id: string; name: string; nickname: string | null; color: string | null }[];

          const yearRange = home.from_year
            ? `${home.from_year} – ${home.to_year ?? "Present"}`
            : home.to_year
            ? `Until ${home.to_year}`
            : null;

          const isCurrent = !home.to_year;
          const coverSrc = home.cover_photo_path
            ? `/api/storage/home-photos/${home.cover_photo_path}`
            : null;

          return (
            <Link
              key={home.id}
              href={`/dashboard/homes/${home.id}`}
              className="group flex gap-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)] hover:shadow-sm"
            >
              {/* Cover photo or placeholder */}
              <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-[var(--surface)]">
                {coverSrc ? (
                  <Image src={coverSrc} alt={home.address ?? home.city ?? "Home"} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">🏡</div>
                )}
                {isCurrent && (
                  <span className="absolute bottom-1 left-1 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Current
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col justify-center gap-1 min-w-0">
                <h2 className="font-display text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] truncate">
                  {home.address ?? home.city ?? "Unnamed home"}
                </h2>
                {home.city && home.address && (
                  <p className="text-sm text-[var(--muted)]">{home.city}</p>
                )}
                {yearRange && (
                  <p className="text-sm text-[var(--muted)]">{yearRange}</p>
                )}
                {members.length > 0 && (
                  <div className="mt-1 flex -space-x-1.5">
                    {members.slice(0, 5).map(m => (
                      <span
                        key={m.id}
                        title={m.nickname ?? m.name}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-[var(--card)]"
                        style={{ backgroundColor: m.color ?? "var(--accent)" }}
                      >
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
