import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { ArtworkDetail } from "./ArtworkDetail";

export default async function ArtworkPiecePage({
  params,
}: {
  params: Promise<{ memberId: string; pieceId: string }>;
}) {
  const { memberId, pieceId } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: member } = await supabase
    .from("family_members")
    .select("id, name, nickname, birth_date")
    .eq("id", memberId)
    .eq("family_id", activeFamilyId)
    .single();

  if (!member) notFound();

  const { data: piece } = await supabase
    .from("artwork_pieces")
    .select(`
      id,
      title,
      description,
      medium,
      date_created,
      age_when_created,
      created_at,
      share_token,
      artwork_photos(id, url, sort_order)
    `)
    .eq("id", pieceId)
    .eq("family_id", activeFamilyId)
    .single();

  if (!piece) notFound();

  const displayName = member.nickname || member.name;

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 sm:px-6">
        <div className="text-sm text-[var(--muted)]">
          <Link href="/dashboard/artwork" className="hover:text-[var(--foreground)]">
            Artwork Portfolios
          </Link>
          {" / "}
          <Link href={`/dashboard/artwork/${memberId}`} className="hover:text-[var(--foreground)]">
            {displayName}
          </Link>
          {" / "}
          <span>{piece.title}</span>
        </div>
      </div>

      <ArtworkDetail
        piece={piece}
        memberId={memberId}
        memberName={displayName}
        birthDate={member.birth_date ?? null}
      />
    </div>
  );
}
