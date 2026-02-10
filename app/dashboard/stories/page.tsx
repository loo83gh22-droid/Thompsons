import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { EmptyState } from "@/app/dashboard/components/EmptyState";
import { StoryCard } from "./StoryCard";

export default async function StoriesPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: stories } = await supabase
    .from("family_stories")
    .select(`
      id,
      title,
      content,
      cover_url,
      category,
      published,
      created_at,
      author_family_member_id,
      family_members!author_family_member_id(name)
    `)
    .eq("family_id", activeFamilyId)
    .eq("published", true)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Family Stories
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Longer-form stories and family history. Share memories, advice, and traditions.
          </p>
        </div>
        <Link
          href="/dashboard/stories/new"
          className="min-h-[44px] rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--background)] transition-colors hover:bg-[var(--accent-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          + Write a story
        </Link>
      </div>

      {!stories?.length ? (
        <EmptyState
          icon="📖"
          headline="No stories yet"
          description="Be the first to share a family memory, lesson learned, or piece of history. Stories can include formatting and a cover image."
          actionLabel="Write your first story"
          actionHref="/dashboard/stories/new"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      )}
    </div>
  );
}
