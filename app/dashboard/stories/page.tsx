import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddStoryEventForm } from "./AddStoryEventForm";
import { formatDateOnly } from "@/src/lib/date";

export default async function StoriesPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: events } = await supabase
    .from("story_events")
    .select(`
      id,
      title,
      event_date,
      story_perspectives(count)
    `)
    .eq("family_id", activeFamilyId)
    .order("sort_order");

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            ← Home
          </Link>
          <h1 className="mt-2 font-display text-4xl font-bold text-[var(--foreground)]">
            Collaborative Stories
          </h1>
          <p className="mt-2 text-lg text-[var(--muted)]">
            Dad&apos;s version vs. the kids&apos; version — different angles on the same memory.
          </p>
        </div>
        <AddStoryEventForm />
      </div>

      {!events?.length ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] py-12 text-center text-[var(--muted)]">
          No stories yet. Create an event and invite everyone to add their perspective.
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const count = (event.story_perspectives as { count: number }[])?.[0]?.count ?? 0;
            return (
              <Link
                key={event.id}
                href={`/dashboard/stories/${event.id}`}
                className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-display font-semibold text-[var(--foreground)]">
                      {event.title}
                    </span>
                    {event.event_date && (
                      <span className="ml-2 text-sm text-[var(--muted)]">
                        {formatDateOnly(event.event_date)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                      {count} perspective{count !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[var(--muted)]">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
