import Link from "next/link";

type Post = { content: string; member_name: string };

export function GratitudeOfTheDay({ post }: { post: Post }) {
  return (
    <Link href="/dashboard/gratitude-board"
      className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition-shadow hover:shadow-sm">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        🌟 Gratitude of the day
      </p>
      <p className="text-[var(--foreground)]">{post.content}</p>
      <p className="mt-1.5 text-xs text-[var(--muted)]">{post.member_name}</p>
    </Link>
  );
}
