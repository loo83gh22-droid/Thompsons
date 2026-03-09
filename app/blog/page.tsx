import type { Metadata } from "next";
import Link from "next/link";
import { posts } from "./posts";

export const metadata: Metadata = {
  title: "Family Memory & Parenting Tips — Family Nest Blog",
  description:
    "Guides on preserving family memories, private photo sharing, digital time capsules, and keeping your whole family connected across generations.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Family Nest Blog — Memory Keeping for Real Families",
    description:
      "Practical guides on preserving photos, stories, recipes, and voices — so nothing important gets lost.",
    url: "https://familynest.io/blog",
    type: "website",
  },
};

const categoryColors: Record<string, string> = {
  "Family Tech": "bg-blue-50 text-blue-700",
  "Memory Keeping": "bg-green-50 text-green-700",
  "Family Activities": "bg-amber-50 text-amber-700",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  const sorted = [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
            The Family Nest Blog
          </p>
          <h1
            className="mb-4 text-4xl font-bold text-[var(--foreground)] md:text-5xl"
            style={{ fontFamily: "var(--font-display-serif)" }}
          >
            Guides for families who care about their memories
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[var(--muted)]">
            Practical articles on preserving photos, stories, voices, and
            traditions — so nothing important gets lost to time.
          </p>
        </div>
      </div>

      {/* Post list */}
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-1">
          {sorted.map((post) => (
            <article
              key={post.slug}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 transition-shadow duration-200 hover:shadow-lg"
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryColors[post.category] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {post.category}
                </span>
                <span className="text-sm text-[var(--muted)]">
                  {post.readingTime}
                </span>
              </div>

              <Link href={`/blog/${post.slug}`}>
                <h2
                  className="mb-3 text-2xl font-bold text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)] md:text-3xl"
                  style={{ fontFamily: "var(--font-display-serif)" }}
                >
                  {post.title}
                </h2>
              </Link>

              <p className="mb-6 text-base leading-relaxed text-[var(--muted)]">
                {post.description}
              </p>

              <div className="flex items-center justify-between">
                <time
                  dateTime={post.publishedAt}
                  className="text-sm text-[var(--muted)]"
                >
                  {formatDate(post.publishedAt)}
                </time>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:text-[var(--primary)]"
                >
                  Read article
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2
            className="mb-3 text-2xl font-bold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-display-serif)" }}
          >
            Ready to start preserving your family&apos;s memories?
          </h2>
          <p className="mb-8 text-[var(--muted)]">
            Invite your whole family — no app store required. Start on the free
            plan and upgrade whenever you&apos;re ready.
          </p>
          <Link
            href="/login?mode=signup"
            className="inline-block rounded-full bg-[var(--accent)] px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:brightness-110 hover:shadow-lg"
          >
            Start Your Family Nest
          </Link>
        </div>
      </div>
    </main>
  );
}
