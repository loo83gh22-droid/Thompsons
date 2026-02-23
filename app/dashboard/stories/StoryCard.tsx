import Link from "next/link";
import Image from "next/image";

function estimateReadTime(content: string): number {
  const words = content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

type Story = {
  id: string;
  title: string;
  content: string;
  cover_url: string | null;
  category: string;
  created_at: string;
  family_members: { name: string; nickname?: string | null; relationship?: string | null } | { name: string; nickname?: string | null; relationship?: string | null }[] | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  family_history: "Family History",
  advice_wisdom: "Advice & Wisdom",
  memorable_moments: "Memorable Moments",
  traditions: "Traditions",
  recipes_food: "Recipes & Food",
  other: "Other",
};

function authorDisplay(fm: Story["family_members"]): string {
  if (!fm) return "";
  const one = Array.isArray(fm) ? fm[0] : fm;
  if (!one) return "";
  const name = one.nickname?.trim() || one.name || "";
  return one.relationship?.trim() ? `${name} (${one.relationship})` : name;
}

export function StoryCard({ story }: { story: Story }) {
  const author = authorDisplay(story.family_members);
  const plainPreview = stripHtml(story.content);
  const preview = plainPreview.slice(0, 100).trim() + (plainPreview.length > 100 ? "…" : "");
  const readMins = estimateReadTime(story.content);
  const date = new Date(story.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <Link
      href={`/dashboard/stories/${story.id}`}
      className="group block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-all duration-200 hover:border-[var(--accent)]/50 hover:shadow-lg"
    >
      {story.cover_url ? (
        <div className="relative aspect-video w-full overflow-hidden bg-[var(--surface-hover)]">
          <Image src={story.cover_url} alt={`Cover image for ${story.title}`} fill unoptimized className="object-cover transition-transform duration-200 group-hover:scale-105" sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 33vw" />
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-[var(--surface-hover)] text-4xl text-[var(--muted)]" aria-hidden>
          📄
        </div>
      )}
      <div className="p-4">
        <span className="text-xs font-medium text-[var(--accent)]">{CATEGORY_LABELS[story.category] ?? story.category}</span>
        <h2 className="mt-1 font-display text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] sm:text-xl">{story.title}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{preview}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0 text-xs text-[var(--muted)]">
          {author && <span>{author}</span>}
          {author && <span>·</span>}
          <span>{date}</span>
          <span>·</span>
          <span>{readMins} min read</span>
        </div>
      </div>
    </Link>
  );
}
