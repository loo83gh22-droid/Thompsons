import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddEventForm } from "./AddEventForm";
import { EventsList } from "./EventsList";
import { EmptyState } from "@/app/dashboard/components/EmptyState";

export default async function EventsPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: events } = await supabase
    .from("family_events")
    .select(`
      id,
      title,
      description,
      event_date,
      recurring,
      category,
      created_by,
      created_at,
      family_members!created_by(name),
      family_event_invitees(family_member_id, family_members(id, name))
    `)
    .eq("family_id", activeFamilyId)
    .order("event_date", { ascending: true });

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name")
    .eq("family_id", activeFamilyId)
    .order("name");

  const today = new Date().toISOString().slice(0, 10);
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const upcoming = (events ?? []).filter((e) => e.event_date >= today && e.event_date <= in30Days);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Family Events
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Track birthdays, anniversaries, reunions, and milestones. Send celebratory messages when the date is near.
          </p>
        </div>
        <AddEventForm members={members ?? []} />
      </div>

      {upcoming.length > 0 && (
        <section className="mb-8 rounded-xl border border-[var(--accent)]/20 bg-[var(--surface)] p-4">
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
            Next 30 days
          </h2>
          <ul className="mt-2 space-y-2">
            {upcoming.slice(0, 5).map((e) => {
              const raw = e.family_members as { name: string } | { name: string }[] | null;
              const creator = Array.isArray(raw) ? raw[0] : raw;
              return (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--foreground)]">{e.title}</span>
                  <span className="text-[var(--muted)]">{e.event_date}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!events?.length ? (
        <EmptyState
          icon="📅"
          headline="No events yet"
          description="Create your first family event to celebrate milestones together—birthdays, anniversaries, reunions."
          actionLabel="Create first event"
          onAction={() => document.querySelector<HTMLButtonElement>("[data-add-event]")?.click()}
        />
      ) : (
        <EventsList events={events} />
      )}
    </div>
  );
}
