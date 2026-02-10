import Link from "next/link";
import Image from "next/image";

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

type Story = {
  id: string;
  title: string;
  content: string;
  cover_url: string | null;
  category: string;
  created_at: string;
  family_members: { name: string } | { name: string }[] | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  family_history: "Family History",
  advice_wisdom: "Advice & Wisdom",
  memorable_moments: "Memorable Moments",
  traditions: "Traditions",
  recipes_food: "Recipes & Food",
  other: "Other",
};

export function StoryCard({ story }: { story: Story }) {
  const author = Array.isArray(story.family_members) ? story.family_members[0] : story.family_members;
  const preview = story.content.slice(0, 100).replace(/\n/g, " ").trim() + (story.content.length > 100 ? "…" : "");
  const readMins = estimateReadTime(story.content);
  const date = new Date(story.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <Link
      href={`/dashboard/stories/${story.id}`}
      className="group block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-all duration-200 hover:border-[var(--accent)]/50 hover:shadow-lg"
    >
      {story.cover_url && (
        <div className="relative aspect-video w-full overflow-hidden bg-[var(--surface-hover)]">
          <Image src={story.cover_url} alt="" fill className="object-cover transition-transform duration-200 group-hover:scale-105" sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 33vw" />
        </div>
      )}
      <div className="p-4">
        <span className="text-xs font-medium text-[var(--accent)]">{CATEGORY_LABELS[story.category] ?? story.category}</span>
        <h2 className="mt-1 font-display text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">{story.title}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{preview}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
          {author?.name && <span>{author.name}</span>}
          <span>·</span>
          <span>{date}</span>
          <span>·</span>
          <span>{readMins} min read</span>
        </div>
      </div>
    </Link>
  );
}
