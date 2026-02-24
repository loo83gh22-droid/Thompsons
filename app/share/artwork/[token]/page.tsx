import { createClient } from "@/src/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

type Props = { params: Promise<{ token: string }> };

const MEDIUM_LABELS: Record<string, string> = {
  drawing: "Drawing",
  painting: "Painting",
  craft: "Craft",
  sculpture: "Sculpture",
  digital: "Digital",
  other: "Other",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createClient();
  const { data: piece } = await supabase
    .from("artwork_pieces")
    .select("title, description")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (!piece) return { title: "Artwork Not Found" };

  const description =
    piece.description?.slice(0, 160) || "A piece of family artwork shared from Family Nest.";

  return {
    title: `${piece.title} — Family Nest`,
    description,
    openGraph: {
      title: piece.title,
      description,
      siteName: "Family Nest",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${piece.title} — Family Nest`,
      description,
    },
  };
}

export default async function PublicArtworkPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: piece } = await supabase
    .from("artwork_pieces")
    .select(
      "id, title, description, medium, date_created, age_when_created, family_member_id, family_id, artwork_photos(id, url, sort_order)"
    )
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (!piece) return notFound();

  const photos = [...(piece.artwork_photos ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  // Get child name
  let childName: string | null = null;
  if (piece.family_member_id) {
    const { data: member } = await supabase
      .from("family_members")
      .select("name, nickname")
      .eq("id", piece.family_member_id)
      .single();
    if (member) childName = member.nickname?.trim() || member.name;
  }

  // Get family name
  const { data: family } = await supabase
    .from("families")
    .select("name")
    .eq("id", piece.family_id)
    .single();

  const familyName = family?.name || "A Family";

  const mediumLabel = piece.medium ? (MEDIUM_LABELS[piece.medium] ?? piece.medium) : null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-display text-lg font-semibold text-[var(--primary)]">
            Family Nest
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            Start Your Family Nest
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Photos */}
        {photos.length > 0 && (
          <div
            className={`mb-8 grid gap-3 ${
              photos.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
            }`}
          >
            {photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.url}
                alt={piece.title}
                loading="lazy"
                className={`w-full rounded-xl object-contain shadow-md ${
                  photos.length === 1 ? "max-h-[500px]" : "aspect-square object-cover"
                }`}
              />
            ))}
          </div>
        )}

        {/* Piece header */}
        <div className="mb-6">
          <p className="text-sm font-medium text-[var(--accent)]">
            From the {familyName} Family
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
            {piece.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            {childName && <span>By {childName}</span>}
            {mediumLabel && (
              <>
                {childName && <span>&middot;</span>}
                <span>{mediumLabel}</span>
              </>
            )}
            {piece.age_when_created != null && (
              <>
                <span>&middot;</span>
                <span>Age {piece.age_when_created}</span>
              </>
            )}
            {piece.date_created && (
              <>
                <span>&middot;</span>
                <span>
                  {new Date(piece.date_created).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {piece.description && (
          <p className="mb-8 whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">
            {piece.description}
          </p>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center sm:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
            Every family has memories worth preserving.
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            Family Nest is a private space to capture artwork, photos, stories, and voices for generations to come.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-full bg-[var(--primary)] px-8 py-3 font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            Start Your Family Nest — Free
          </Link>
        </div>
      </main>
    </div>
  );
}
