import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { posts, getPost, type ContentBlock } from "../posts";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} — Family Nest`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://familynest.io/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <h2
          className="mb-4 mt-10 text-2xl font-bold text-[var(--foreground)] first:mt-0 md:text-3xl"
          style={{ fontFamily: "var(--font-display-serif)" }}
        >
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 className="mb-3 mt-8 text-xl font-semibold text-[var(--foreground)]">
          {block.text}
        </h3>
      );
    case "p":
      return (
        <p className="mb-5 text-base leading-relaxed text-[var(--foreground)]/80">
          {block.text}
        </p>
      );
    case "ul":
      return (
        <ul className="mb-5 space-y-2 pl-5">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="list-disc text-base leading-relaxed text-[var(--foreground)]/80"
            >
              {item}
            </li>
          ))}
        </ul>
      );
    case "cta":
      return (
        <div className="my-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <h3
            className="mb-2 text-xl font-bold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-display-serif)" }}
          >
            {block.heading}
          </h3>
          <p className="mb-6 text-[var(--muted)]">{block.body}</p>
          <Link
            href={block.href}
            className="inline-block rounded-full bg-[var(--accent)] px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:brightness-110 hover:shadow-lg"
          >
            {block.buttonText}
          </Link>
        </div>
      );
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.description,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        author: {
          "@type": "Organization",
          name: "Family Nest",
          url: "https://familynest.io",
        },
        publisher: {
          "@type": "Organization",
          name: "Family Nest",
          logo: {
            "@type": "ImageObject",
            url: "https://familynest.io/icon-512.png",
          },
        },
        url: `https://familynest.io/blog/${post.slug}`,
        mainEntityOfPage: `https://familynest.io/blog/${post.slug}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://familynest.io",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: "https://familynest.io/blog",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: `https://familynest.io/blog/${post.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-[var(--background)]">
        {/* Breadcrumb nav */}
        <div className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-3xl px-6 py-4">
            <nav className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <Link href="/" className="hover:text-[var(--foreground)]">
                Home
              </Link>
              <span>/</span>
              <Link
                href="/blog"
                className="hover:text-[var(--foreground)]"
              >
                Blog
              </Link>
              <span>/</span>
              <span className="text-[var(--foreground)]">{post.category}</span>
            </nav>
          </div>
        </div>

        {/* Article header */}
        <header className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-3xl px-6 py-14">
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                {post.category}
              </span>
              <span className="text-sm text-[var(--muted)]">
                {post.readingTime}
              </span>
            </div>
            <h1
              className="mb-5 text-3xl font-bold leading-tight text-[var(--foreground)] md:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--font-display-serif)" }}
            >
              {post.title}
            </h1>
            <p className="mb-6 text-lg leading-relaxed text-[var(--muted)]">
              {post.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
              <span>By Family Nest</span>
              <span>·</span>
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
              {post.updatedAt !== post.publishedAt && (
                <>
                  <span>·</span>
                  <span>Updated {formatDate(post.updatedAt)}</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Article body */}
        <article className="mx-auto max-w-3xl px-6 py-14">
          {post.content.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </article>

        {/* Back to blog */}
        <div className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-3xl px-6 py-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:text-[var(--primary)]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to all articles
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
