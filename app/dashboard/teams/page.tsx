import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";

export const metadata: Metadata = {
  title: "Our Teams | Family Nest",
};

type TeamRow = {
  id: string;
  name: string;
  sport_or_activity: string;
  season: string | null;
  year: number | null;
  city: string | null;
  description: string | null;
  cover_photo_id: string | null;
  created_at: string;
};

type PhotoRow = { id: string; team_id: string; url: string };
type MemberRow = {
  team_id: string;
  role: string;
  family_members: { id: string; name: string; nickname: string | null; color: string | null } | null;
};

export default async function TeamsPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, sport_or_activity, season, year, city, description, cover_photo_id, created_at")
    .eq("family_id", activeFamilyId)
    .order("year", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const teamIds = (teams ?? []).map((t) => t.id);

  // Batch-fetch cover photos and members
  const [photosRes, membersRes] = await Promise.all([
    teamIds.length > 0
      ? supabase
          .from("team_photos")
          .select("id, team_id, url")
          .in("team_id", teamIds)
          .order("sort_order")
      : Promise.resolve({ data: [] }),
    teamIds.length > 0
      ? supabase
          .from("team_members")
          .select("team_id, role, family_members(id, name, nickname, color)")
          .in("team_id", teamIds)
      : Promise.resolve({ data: [] }),
  ]);

  const photosByTeam = new Map<string, PhotoRow[]>();
  for (const p of (photosRes.data ?? []) as PhotoRow[]) {
    if (!photosByTeam.has(p.team_id)) photosByTeam.set(p.team_id, []);
    photosByTeam.get(p.team_id)!.push(p);
  }

  const membersByTeam = new Map<string, MemberRow[]>();
  for (const m of ((membersRes.data ?? []) as unknown) as MemberRow[]) {
    if (!membersByTeam.has(m.team_id)) membersByTeam.set(m.team_id, []);
    membersByTeam.get(m.team_id)!.push(m);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Our Teams</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Sports seasons, clubs, and activities — with photos and stories from every year.
          </p>
        </div>
        <Link
          href="/dashboard/teams/new"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Add team
        </Link>
      </div>

      {/* Empty state */}
      {(!teams || teams.length === 0) && (
        <div className="mt-20 text-center">
          <div className="text-5xl">🏅</div>
          <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">No teams yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Add your first team — a sports season, a club, a league, anything your family played or coached.
          </p>
          <Link
            href="/dashboard/teams/new"
            className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Add first team
          </Link>
        </div>
      )}

      {/* Team list — journal-style: photo left, content right */}
      <div className="space-y-6">
        {(teams ?? []).map((team: TeamRow) => {
          const photos = photosByTeam.get(team.id) ?? [];
          const coverPhoto = team.cover_photo_id
            ? photos.find((p) => p.id === team.cover_photo_id)
            : photos[0];
          const members = membersByTeam.get(team.id) ?? [];

          return (
            <Link
              key={team.id}
              href={`/dashboard/teams/${team.id}`}
              className="group flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)] hover:shadow-sm sm:gap-6"
            >
              {/* Cover photo */}
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-[var(--surface)] sm:h-36 sm:w-36">
                {coverPhoto ? (
                  <Image
                    src={coverPhoto.url}
                    alt={team.name}
                    fill
                    className="object-cover"
                    sizes="144px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">🏅</div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 py-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--accent)]">
                    {team.name}
                  </h2>
                  {team.season && team.year && (
                    <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs text-[var(--muted)]">
                      {team.season} {team.year}
                    </span>
                  )}
                  {team.year && !team.season && (
                    <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs text-[var(--muted)]">
                      {team.year}
                    </span>
                  )}
                </div>

                <p className="mt-0.5 text-sm text-[var(--muted)]">
                  {team.sport_or_activity}
                  {team.city ? ` · ${team.city}` : ""}
                </p>

                {team.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--foreground)] opacity-80">
                    {team.description}
                  </p>
                )}

                {/* Member avatars */}
                {members.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {members.map((m) => {
                      const member = m.family_members;
                      if (!member) return null;
                      return (
                        <span
                          key={member.id}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: member.color ?? "#6b7280" }}
                        >
                          {member.nickname ?? member.name}
                          {m.role !== "Player" && (
                            <span className="opacity-75">· {m.role}</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Photo count badge */}
                {photos.length > 1 && (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {photos.length} photo{photos.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
