import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { EmptyState } from "../components/EmptyState";

export default async function ArtworkPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  // All family members
  const { data: members } = await supabase
    .from("family_members")
    .select("id, name, nickname, avatar_url")
    .eq("family_id", activeFamilyId)
    .eq("is_remembered", false)
    .order("name");

  // Piece counts per member
  const { data: counts } = await supabase
    .from("artwork_pieces")
    .select("family_member_id")
    .eq("family_id", activeFamilyId);

  // Latest photo per member
  const { data: latestPhotos } = await supabase
    .from("artwork_pieces")
    .select(`
      family_member_id,
      artwork_photos(url, sort_order)
    `)
    .eq("family_id", activeFamilyId)
    .order("created_at", { ascending: false });

  // Build per-member summaries
  const countByMember: Record<string, number> = {};
  for (const row of counts ?? []) {
    countByMember[row.family_member_id] = (countByMember[row.family_member_id] ?? 0) + 1;
  }

  // Find first photo for each member from latest pieces
  const coverByMember: Record<string, string | null> = {};
  for (const piece of latestPhotos ?? []) {
    if (!coverByMember[piece.family_member_id]) {
      const photos = (piece.artwork_photos as { url: string; sort_order: number }[] | null) ?? [];
      const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order);
      coverByMember[piece.family_member_id] = sorted[0]?.url ?? null;
    }
  }

  const membersWithPieces = (members ?? []).filter((m) => (countByMember[m.id] ?? 0) > 0);
  const membersWithoutPieces = (members ?? []).filter((m) => (countByMember[m.id] ?? 0) === 0);

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
              Artwork Portfolios
            </h1>
            <p className="mt-2 text-[var(--muted)]">
              A growing gallery of every drawing, painting, and creation — one portfolio per person.
            </p>
          </div>
        </div>
      </div>

      {membersWithPieces.length === 0 && membersWithoutPieces.length === 0 ? (
        <EmptyState
          icon="🎨"
          headline="No family members yet"
          description="Add family members first, then start capturing their artwork."
          actionLabel="Add members"
          actionHref="/dashboard/our-family"
        />
      ) : membersWithPieces.length === 0 ? (
        <div className="space-y-8">
          <EmptyState
            icon="🎨"
            headline="No artwork yet"
            description="Start capturing your children's creations — each person gets their own growing portfolio."
          />
          <div>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
              Start a portfolio for
            </h2>
            <div className="flex flex-wrap gap-3">
              {membersWithoutPieces.map((member) => (
                <Link
                  key={member.id}
                  href={`/dashboard/artwork/${member.id}/new`}
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {membersWithPieces.map((member) => {
              const count = countByMember[member.id] ?? 0;
              const cover = coverByMember[member.id] ?? null;
              return (
                <Link
                  key={member.id}
                  href={`/dashboard/artwork/${member.id}`}
                  className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] w-full bg-[var(--surface)]">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={`${member.nickname || member.name}'s artwork`}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">🎨</div>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <p className="font-semibold text-[var(--foreground)]">
                      {member.nickname || member.name}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--muted)]">
                      {count} {count === 1 ? "piece" : "pieces"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {membersWithoutPieces.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
                Start a portfolio for
              </h2>
              <div className="flex flex-wrap gap-3">
                {membersWithoutPieces.map((member) => (
                  <Link
                    key={member.id}
                    href={`/dashboard/artwork/${member.id}/new`}
                    className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    + {member.nickname || member.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
