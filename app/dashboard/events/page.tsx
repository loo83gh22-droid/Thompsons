import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddEventForm } from "./AddEventForm";
import { EventsList } from "./EventsList";
import { BirthdaySync } from "./BirthdaySync";
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

  return (
    <div>
      <BirthdaySync />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Family Events
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Never miss a birthday, anniversary, or family celebration
          </p>
        </div>
        <AddEventForm members={members ?? []} />
      </div>

      {!events?.length ? (
        <EmptyState
          icon="📅"
          headline="No events yet"
          description="Add your family's important dates so you never miss a birthday, anniversary, or celebration!"
          actionLabel="+ Add your first event"
          onAction={() => document.querySelector<HTMLButtonElement>("[data-add-event]")?.click()}
        />
      ) : (
        <EventsList events={events} members={members ?? []} />
      )}
    </div>
  );
}
