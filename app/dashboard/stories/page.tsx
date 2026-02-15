import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { EmptyStateGuide } from "@/app/components/EmptyStateGuide";
import { StoriesList } from "./StoriesList";

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
      family_members!author_family_member_id(name, nickname, relationship)
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
            Longer-form family history, advice, and memorable moments
          </p>
        </div>
        <Link
          href="/dashboard/stories/new"
          className="min-h-[44px] shrink-0 rounded-full bg-[var(--primary)] px-5 py-2 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          + Write a story
        </Link>
      </div>

      {!stories?.length ? (
        <EmptyStateGuide
          icon="📖"
          title="No stories yet"
          description="Be the first to share a family memory, historical account, or lesson learned"
          inspiration={[
            "How your parents met",
            "The story of your family's immigration or big move",
            "A lesson a grandparent taught you",
            "The funniest thing that happened on a family vacation",
          ]}
          ctaLabel="Write your first story"
          ctaHref="/dashboard/stories/new"
        />
      ) : (
        <StoriesList stories={stories} />
      )}
    </div>
  );
}
