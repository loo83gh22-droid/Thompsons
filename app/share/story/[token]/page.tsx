// Share pages use the admin (service-role) client — anon RLS policies for public shares were removed in migration 070. Token validation is enforced in app code via share_token + is_public filters (MED-1 fix).
import { createAdminClient } from "@/src/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const supabase = createAdminClient();
  const { data: story } = await supabase
    .from("family_stories")
    .select("title, content")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (!story) return { title: "Story Not Found" };

  const description = story.content?.slice(0, 160) || "A family story shared from Family Nest.";

  const pageUrl = `https://familynest.io/share/story/${token}`;

  return {
    title: `${story.title} — Family Nest`,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: story.title,
      description,
      url: pageUrl,
      siteName: "Family Nest",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${story.title} — Family Nest`,
      description,
    },
  };
}

export default async function PublicStoryPage({ params }: Props) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: story } = await supabase
    .from("family_stories")
    .select("id, title, content, cover_url, category, created_at, author_family_member_id, family_id")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (!story) return notFound();

  // Get author name
  let authorName: string | null = null;
  if (story.author_family_member_id) {
    const { data: author } = await supabase
      .from("family_members")
      .select("name, nickname")
      .eq("id", story.author_family_member_id)
      .single();
    if (author) authorName = author.nickname?.trim() || author.name;
  }

  // Get family name
  const { data: family } = await supabase
    .from("families")
    .select("name")
    .eq("id", story.family_id)
    .single();

  const familyName = family?.name || "A Family";

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
        {/* Cover image */}
        {story.cover_url && (
          <img
            src={story.cover_url}
            alt={`Cover image for ${story.title}`}
            loading="lazy"
            className="mb-8 w-full rounded-xl object-cover shadow-lg"
            style={{ maxHeight: "400px" }}
          />
        )}

        {/* Story header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-[var(--accent)]">
            From the {familyName} Family
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
            {story.title}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-[var(--muted)]">
            {authorName && <span>By {authorName}</span>}
            {authorName && <span>&middot;</span>}
            <span>
              {new Date(story.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Story content */}
        <article className="prose max-w-none text-[var(--foreground)] leading-relaxed">
          {story.content.split("\n").map((paragraph: string, i: number) => (
            <p key={i} className="mb-4 text-[var(--muted)] leading-relaxed">
              {paragraph}
            </p>
          ))}
        </article>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center sm:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
            Every family has stories worth preserving.
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            Family Nest is a private space to capture memories, photos, recipes, and voices for generations to come.
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
