import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { StoryForm } from "../../StoryForm";

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: story } = await supabase
    .from("family_stories")
    .select("id, title, content, cover_url, category, published, author_family_member_id")
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!story) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();
  const { data: me } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", activeFamilyId)
    .eq("user_id", user.id)
    .single();
  const isAuthor = !!me && story.author_family_member_id === me.id;
  if (!isAuthor) notFound();

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name")
    .eq("family_id", activeFamilyId)
    .order("name");

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Edit story</h1>
      <p className="mt-2 text-[var(--muted)]">
        Update your story. Changes are saved when you click Update.
      </p>
      <StoryForm
        members={members ?? []}
        editStory={{
          id: story.id,
          title: story.title,
          content: story.content,
          category: story.category ?? "memorable_moments",
          published: !!story.published,
          cover_url: story.cover_url,
          author_family_member_id: story.author_family_member_id,
        }}
      />
    </div>
  );
}
