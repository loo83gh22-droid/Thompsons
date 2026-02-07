import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { formatDateOnly } from "@/src/lib/date";
import { AddPerspectiveForm } from "../AddPerspectiveForm";
import { DeleteStoryButton } from "../DeleteStoryButton";

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: eventData, error } = await supabase
    .from("story_events")
    .select(`
      id,
      title,
      event_date,
      story_perspectives(
        id,
        content,
        family_member_id,
        family_member:family_members(name)
      )
    `)
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  if (error || !eventData) notFound();

  const perspectivesData = ((eventData.story_perspectives || []) as {
    id: string;
    content: string;
    family_member_id: string;
    family_member: { name: string } | { name: string }[] | null;
  }[]);
  const existingMemberIds = perspectivesData.map((p) => p.family_member_id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/stories"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Stories
        </Link>
      </div>

      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
                {eventData.title}
              </h1>
              {eventData.event_date && (
                <p className="mt-1 text-[var(--muted)]">
                  {formatDateOnly(eventData.event_date)}
                </p>
              )}
            </div>
            <DeleteStoryButton storyEventId={eventData.id} />
          </div>

          <div className="mt-8 space-y-8">
            {perspectivesData.length === 0 ? (
              <p className="text-[var(--muted)]">
                No perspectives yet. Add the first one below.
              </p>
            ) : (
              perspectivesData.map((p) => {
                const name = Array.isArray(p.family_member) ? p.family_member[0]?.name : p.family_member?.name;
                return (
                  <div
                    key={p.id}
                    className="rounded-lg border-l-4 border-[var(--accent)]/50 bg-[var(--background)] p-4"
                  >
                    <p className="text-sm font-medium text-[var(--muted)]">
                      {name}&apos;s version
                    </p>
                    <div className="mt-2 whitespace-pre-wrap text-[var(--foreground)]">
                      {p.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </article>

      <div className="mt-8">
        <AddPerspectiveForm
          storyEventId={eventData.id}
          existingMemberIds={existingMemberIds}
        />
      </div>
    </div>
  );
}
