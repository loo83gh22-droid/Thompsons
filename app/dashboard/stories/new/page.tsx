import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { StoryForm } from "../StoryForm";

export default async function NewStoryPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name")
    .eq("family_id", activeFamilyId)
    .order("name");

  const currentUserId = (await supabase.auth.getUser()).data.user?.id;
  let defaultAuthorId: string | null = null;
  if (currentUserId) {
    const { data: me } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", activeFamilyId)
      .eq("user_id", currentUserId)
      .single();
    defaultAuthorId = me?.id ?? null;
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Write a story</h1>
      <p className="mt-2 text-[var(--muted)]">
        Share a family memory, lesson, or piece of history. Use the toolbar for bold, italic, headings, lists, and links.
      </p>
      <StoryForm members={members ?? []} defaultAuthorMemberId={defaultAuthorId} />
    </div>
  );
}
