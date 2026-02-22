import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { getFamilyPlan, canSharePublicly } from "@/src/lib/plans";
import { StoryContent } from "../StoryContent";
import { StoryDetailActions } from "../StoryDetailActions";
import { StoryShareButton } from "../StoryShareButton";

const CATEGORY_LABELS: Record<string, string> = {
  family_history: "Family History",
  advice_wisdom: "Advice & Wisdom",
  memorable_moments: "Memorable Moments",
  traditions: "Traditions",
  recipes_food: "Recipes & Food",
  other: "Other",
};

function estimateReadTime(content: string): number {
  const words = content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function authorDisplay(fm: { name: string; nickname?: string | null; relationship?: string | null } | { name: string; nickname?: string | null; relationship?: string | null }[] | null): string {
  if (!fm) return "";
  const one = Array.isArray(fm) ? fm[0] : fm;
  if (!one) return "";
  const name = one.nickname?.trim() || one.name || "";
  return one.relationship?.trim() ? `${name} (${one.relationship})` : name;
}

export default async function StoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: story } = await supabase
    .from("family_stories")
    .select(`
      id,
      title,
      content,
      cover_url,
      category,
      published,
      created_at,
      updated_at,
      author_family_member_id,
      created_by,
      is_public,
      share_token,
      family_members!author_family_member_id(name, nickname, relationship)
    `)
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!story) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  let myMemberId: string | null = null;
  if (user) {
    const { data: me } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", activeFamilyId)
      .eq("user_id", user.id)
      .single();
    myMemberId = me?.id ?? null;
  }

  // You can edit if you created the story OR you're listed as the author/subject
  const isAuthor = !!myMemberId && (story.created_by === myMemberId || story.author_family_member_id === myMemberId);
  if (!story.published && !isAuthor) notFound();

  const authorStr = authorDisplay(story.family_members);
  const readMins = estimateReadTime(story.content);
  const date = new Date(story.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const categoryLabel = CATEGORY_LABELS[story.category] ?? story.category;

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/stories" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Stories
      </Link>
      {story.cover_url && (
        <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl">
          <Image src={story.cover_url} alt={`Cover image for ${story.title}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 800px" priority />
        </div>
      )}
      <h1 className="mt-6 font-display text-2xl font-bold text-[var(--foreground)] sm:text-3xl">{story.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        <span className="rounded bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
          {categoryLabel}
        </span>
        {authorStr && <span>{authorStr}</span>}
        {authorStr && <span>·</span>}
        <span>{date}</span>
        <span>·</span>
        <span>{readMins} min read</span>
      </div>
      <div className="mt-6">
        <StoryContent content={story.content} />
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        <StoryDetailActions storyId={story.id} isAuthor={isAuthor} />
      </div>

      {/* Share to social media */}
      {isAuthor && (
        <div className="mt-6">
          <StoryShareButton
            storyId={story.id}
            title={story.title}
            isPublic={story.is_public ?? false}
            shareToken={story.share_token ?? null}
          />
        </div>
      )}
    </div>
  );
}
