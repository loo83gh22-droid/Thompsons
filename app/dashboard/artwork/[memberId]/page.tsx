import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { ArtworkGallery } from "./ArtworkGallery";

export default async function MemberArtworkPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: member } = await supabase
    .from("family_members")
    .select("id, name, nickname, birth_date, avatar_url")
    .eq("id", memberId)
    .eq("family_id", activeFamilyId)
    .single();

  if (!member) notFound();

  const { data: pieces } = await supabase
    .from("artwork_pieces")
    .select(`
      id,
      title,
      description,
      medium,
      date_created,
      age_when_created,
      created_at,
      artwork_photos(id, url, sort_order)
    `)
    .eq("family_id", activeFamilyId)
    .eq("family_member_id", memberId)
    .order("date_created", { ascending: false, nullsFirst: false });

  const displayName = member.nickname || member.name;

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-sm text-[var(--muted)]">
              <Link href="/dashboard/artwork" className="hover:text-[var(--foreground)]">
                Artwork Portfolios
              </Link>
              {" / "}
              <span>{displayName}</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
              {displayName}&apos;s Portfolio
            </h1>
            <p className="mt-1 text-[var(--muted)]">
              {pieces?.length ?? 0} {(pieces?.length ?? 0) === 1 ? "piece" : "pieces"}
            </p>
          </div>
          <Link
            href={`/dashboard/artwork/${memberId}/new`}
            className="min-h-[44px] shrink-0 rounded-full bg-[var(--primary)] px-5 py-2 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            + Add artwork
          </Link>
        </div>
      </div>

      <ArtworkGallery
        pieces={pieces ?? []}
        memberId={memberId}
        memberName={displayName}
      />
    </div>
  );
}
