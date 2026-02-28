import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { EmptyState } from "../components/EmptyState";

export default async function TrophyCasePage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name, nickname, avatar_url")
    .eq("family_id", activeFamilyId)
    .eq("is_remembered", false)
    .order("name");

  const { data: allAwards } = await supabase
    .from("awards")
    .select("id, award_files(url, file_type, sort_order)")
    .eq("family_id", activeFamilyId)
    .order("created_at", { ascending: false });

  const awardIds = allAwards?.map((a) => a.id) ?? [];

  const { data: allAwardMembers } = awardIds.length > 0
    ? await supabase
        .from("award_members")
        .select("award_id, family_member_id")
        .in("award_id", awardIds)
    : { data: [] };

  type AwardFile = { url: string; file_type: string; sort_order: number };
  const awardCoverMap: Record<string, string | null> = {};
  for (const award of allAwards ?? []) {
    const images = ((award.award_files as AwardFile[] | null) ?? [])
      .filter((f) => f.file_type === "image")
      .sort((a, b) => a.sort_order - b.sort_order);
    awardCoverMap[award.id] = images[0]?.url ?? null;
  }

  const countByMember: Record<string, number> = {};
  const coverByMember: Record<string, string | null> = {};
  for (const award of allAwards ?? []) {
    const memberIdsForAward = (allAwardMembers ?? [])
      .filter((m) => m.award_id === award.id)
      .map((m) => m.family_member_id);
    for (const mid of memberIdsForAward) {
      countByMember[mid] = (countByMember[mid] ?? 0) + 1;
      if (!(mid in coverByMember)) {
        coverByMember[mid] = awardCoverMap[award.id] ?? null;
      }
    }
  }

  const membersWithTrophies = (members ?? []).filter((m) => (countByMember[m.id] ?? 0) > 0);
  const membersWithout = (members ?? []).filter((m) => (countByMember[m.id] ?? 0) === 0);

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
              🏆 Trophy Case
            </h1>
            <p className="mt-2 text-[var(--muted)]">
              Trophies, recognitions, and milestones — every accomplishment worth remembering.
            </p>
          </div>
        </div>
      </div>

      {membersWithTrophies.length === 0 && membersWithout.length === 0 ? (
        <EmptyState
          icon="🏆"
          headline="No family members yet"
          description="Add family members first, then start recording their trophies and achievements."
          actionLabel="Add members"
          actionHref="/dashboard/our-family"
        />
      ) : membersWithTrophies.length === 0 ? (
        <div className="space-y-8">
          <EmptyState
            icon="🏆"
            headline="Trophy case is empty"
            description="Start preserving the trophies, certificates, and recognitions your family has earned."
          />
          <div>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
              Add a trophy for
            </h2>
            <div className="flex flex-wrap gap-3">
              {membersWithout.map((member) => (
                <Link
                  key={member.id}
                  href={`/dashboard/trophy-case/${member.id}/new`}
                  className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  + {member.nickname || member.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {membersWithout.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
                Add a trophy for
              </h2>
              <div className="flex flex-wrap gap-3">
                {membersWithout.map((member) => (
                  <Link
                    key={member.id}
                    href={`/dashboard/trophy-case/${member.id}/new`}
                    className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    + {member.nickname || member.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {membersWithTrophies.map((member) => {
              const count = countByMember[member.id] ?? 0;
              const cover = coverByMember[member.id] ?? null;
              return (
                <Link
                  key={member.id}
                  href={`/dashboard/trophy-case/${member.id}`}
                  className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] w-full bg-[var(--surface)]">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={`${member.nickname || member.name}'s trophies`}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">🏆</div>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <p className="font-semibold text-[var(--foreground)]">
                      {member.nickname || member.name}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--muted)]">
                      {count} {count === 1 ? "trophy" : "trophies"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
