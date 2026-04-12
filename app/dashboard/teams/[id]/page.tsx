import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { DeleteTeamButton } from "./DeleteTeamButton";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata: Metadata = {
  title: "Team | Family Nest",
};

type Props = { params: Promise<{ id: string }> };

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const { data: { user } } = await supabase.auth.getUser();

  const [teamRes, photosRes, membersRes, myMemberRes] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, sport_or_activity, season, year, city, description, cover_photo_id, created_by, created_at")
      .eq("id", id)
      .eq("family_id", activeFamilyId)
      .single(),
    supabase
      .from("team_photos")
      .select("id, url, caption, sort_order")
      .eq("team_id", id)
      .order("sort_order"),
    supabase
      .from("team_members")
      .select("role, family_members(id, name, nickname, color)")
      .eq("team_id", id),
    user
      ? supabase
          .from("family_members")
          .select("id, role")
          .eq("user_id", user.id)
          .eq("family_id", activeFamilyId)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  if (!teamRes.data) notFound();

  const team = teamRes.data;
  const photos = photosRes.data ?? [];
  const members = ((membersRes.data ?? []) as unknown) as {
    role: string;
    family_members: { id: string; name: string; nickname: string | null; color: string | null } | null;
  }[];
  const myRole = myMemberRes.data?.role;
  const canEdit = myRole === "owner" || myRole === "adult";

  const coverPhoto = team.cover_photo_id
    ? photos.find((p) => p.id === team.cover_photo_id)
    : photos[0];
  const galleryPhotos = photos.filter((p) => p.id !== coverPhoto?.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back link */}
      <Link href="/dashboard/teams" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Our Teams
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">{team.name}</h1>
          <p className="mt-1 text-base text-[var(--muted)]">
            {team.sport_or_activity}
            {team.season ? ` · ${team.season}` : ""}
            {team.year ? ` ${team.year}` : ""}
            {team.city ? ` · ${team.city}` : ""}
          </p>
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/dashboard/teams/${id}/edit`}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)]"
            >
              Edit
            </Link>
            <DeleteTeamButton teamId={id} teamName={team.name} />
          </div>
        )}
      </div>

      {/* Cover photo */}
      {coverPhoto && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl">
          <Image
            src={coverPhoto.url}
            alt={team.name}
            fill
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
            priority
          />
        </div>
      )}

      {/* Members */}
      {members.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {members.map((m, i) => {
            const member = m.family_members;
            if (!member) return null;
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-white"
                style={{ backgroundColor: member.color ?? "#6b7280" }}
              >
                {member.nickname ?? member.name}
                {m.role !== "Player" && (
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                    {m.role}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Write-up */}
      {team.description && (
        <div className="mt-6">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-[var(--foreground)]">
            {team.description}
          </p>
        </div>
      )}

      {/* Gallery */}
      {galleryPhotos.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 font-display text-lg font-semibold text-[var(--foreground)]">
            Photos ({photos.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {galleryPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-lg bg-[var(--surface)]"
              >
                <Image
                  src={photo.url}
                  alt={photo.caption ?? "Team photo"}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 px-2 py-1.5">
                    <p className="text-xs text-white">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty — no cover, no description, no gallery */}
      {!coverPhoto && !team.description && galleryPhotos.length === 0 && (
        <div className="mt-12 text-center">
          <div className="text-4xl">📷</div>
          <p className="mt-3 text-sm text-[var(--muted)]">
            No photos or write-up yet.{" "}
            {canEdit && (
              <Link href={`/dashboard/teams/${id}/edit`} className="text-[var(--accent)] hover:underline">
                Add some now
              </Link>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
