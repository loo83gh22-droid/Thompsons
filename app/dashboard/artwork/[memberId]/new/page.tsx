import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { ArtworkForm } from "../ArtworkForm";

export default async function NewArtworkPage({
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
    .select("id, name, nickname, birth_date")
    .eq("id", memberId)
    .eq("family_id", activeFamilyId)
    .single();

  if (!member) notFound();

  const displayName = member.nickname || member.name;

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <div className="mb-1 text-sm text-[var(--muted)]">
          <Link href="/dashboard/artwork" className="hover:text-[var(--foreground)]">
            Artwork Portfolios
          </Link>
          {" / "}
          <Link href={`/dashboard/artwork/${memberId}`} className="hover:text-[var(--foreground)]">
            {displayName}
          </Link>
          {" / "}
          <span>Add artwork</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">
          Add artwork for {displayName}
        </h1>
      </div>

      <ArtworkForm
        memberId={memberId}
        memberName={displayName}
        birthDate={member.birth_date ?? null}
      />
    </div>
  );
}
