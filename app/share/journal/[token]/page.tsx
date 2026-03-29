// Share pages use the admin (service-role) client — anon RLS policies for public shares were removed. Token validation is enforced in app code via share_token + is_public filters.
import { createAdminClient } from "@/src/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const supabase = createAdminClient();
  const { data: entry } = await supabase
    .from("journal_entries")
    .select("title, content")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (!entry) return { title: "Journal Entry Not Found" };

  const description = entry.content?.slice(0, 160) || "A journal entry shared from Family Nest.";
  const pageUrl = `https://familynest.io/share/journal/${token}`;

  return {
    title: `${entry.title} | Family Nest`,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: entry.title,
      description,
      url: pageUrl,
      siteName: "Family Nest",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${entry.title} | Family Nest`,
      description,
    },
  };
}

export default async function PublicJournalEntryPage({ params }: Props) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: entry } = await supabase
    .from("journal_entries")
    .select("id, title, content, location, trip_date, trip_date_end, created_at, author_id, family_id")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (!entry) return notFound();

  // Fetch photos
  const { data: photos } = await supabase
    .from("journal_photos")
    .select("id, url, caption")
    .eq("entry_id", entry.id)
    .order("sort_order");

  // Fetch author name
  let authorName: string | null = null;
  if (entry.author_id) {
    const { data: author } = await supabase
      .from("family_members")
      .select("name, nickname")
      .eq("id", entry.author_id)
      .single();
    if (author) authorName = author.nickname?.trim() || author.name;
  }

  // Fetch family name
  const { data: family } = await supabase
    .from("families")
    .select("name")
    .eq("id", entry.family_id)
    .single();

  const familyName = family?.name || "A Family";

  const dateStr = entry.trip_date
    ? entry.trip_date_end && entry.trip_date_end !== entry.trip_date
      ? `${new Date(entry.trip_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} \u2013 ${new Date(entry.trip_date_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
      : new Date(entry.trip_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : new Date(entry.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const visiblePhotos = (photos ?? []).slice(0, 6);

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
        {/* Entry header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-[var(--accent)]">
            From the {familyName} Family
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
            {entry.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            {authorName && <span>By {authorName}</span>}
            {authorName && <span>&middot;</span>}
            <span>{dateStr}</span>
            {entry.location && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--secondary)] px-2 py-0.5 text-xs text-[var(--foreground)]">
                📍 {entry.location}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        {entry.content && (
          <div className="mb-8 whitespace-pre-wrap leading-relaxed text-[var(--foreground)]/90">
            {entry.content}
          </div>
        )}

        {/* Photo grid */}
        {visiblePhotos.length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {visiblePhotos.map((photo) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.caption || ""}
                className="aspect-square w-full rounded-lg object-cover"
                loading="lazy"
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center sm:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
            Every family has moments worth preserving.
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            Family Nest is a private space to capture memories, photos, recipes, and voices for generations to come.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-full bg-[var(--primary)] px-8 py-3 font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            Start Your Family Nest (Free)
          </Link>
        </div>
      </main>
    </div>
  );
}
