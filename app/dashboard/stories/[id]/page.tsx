import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { PrintButton } from "../PrintButton";

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
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
      family_members!author_family_member_id(name)
    `)
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!story) notFound();

  const author = Array.isArray(story.family_members) ? story.family_members[0] : story.family_members;
  const readMins = estimateReadTime(story.content);
  const date = new Date(story.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/stories" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Stories
      </Link>
      {story.cover_url && (
        <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl">
          <Image src={story.cover_url} alt="" fill className="object-cover" sizes="800px" priority />
        </div>
      )}
      <h1 className="mt-6 font-display text-3xl font-bold text-[var(--foreground)]">{story.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        {author?.name && <span>{author.name}</span>}
        <span>·</span>
        <span>{date}</span>
        <span>·</span>
        <span>{readMins} min read</span>
      </div>
      <div className="mt-6 whitespace-pre-wrap text-[var(--foreground)]/90 leading-relaxed">
        {story.content}
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        <PrintButton />
        <Link href="/dashboard/stories" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-hover)]">
          Back to stories
        </Link>
      </div>
    </div>
  );
}
