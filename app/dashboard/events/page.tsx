import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddEventForm } from "./AddEventForm";
import { EventsList } from "./EventsList";
import { BirthdaySync } from "./BirthdaySync";
import { EmptyState } from "@/app/dashboard/components/EmptyState";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  recurring: string;
  category: string;
  created_by: string | null;
  created_at: string;
  family_members: { name: string } | { name: string }[] | null;
  family_event_invitees?: { family_member_id: string; family_members: { id: string; name: string } | null }[];
};

export default async function EventsPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  let events: EventRow[] = [];
  let members: { id: string; name: string }[] = [];

  const membersRes = await supabase
    .from("family_members")
    .select("id, name")
    .eq("family_id", activeFamilyId)
    .order("name");
  members = (membersRes.data ?? []) as { id: string; name: string }[];

  try {
    const eventsRes = await supabase
      .from("family_events")
      .select("id, title, description, event_date, recurring, category, created_by, created_at, family_members!created_by(name)")
      .eq("family_id", activeFamilyId)
      .order("event_date", { ascending: true });

    if (eventsRes.error) {
      events = [];
    } else {
    const rawEvents = (eventsRes.data ?? []) as (Omit<EventRow, "family_event_invitees"> & { family_members?: unknown })[];

    if (rawEvents.length > 0) {
      const eventIds = rawEvents.map((e) => e.id);
      const { data: inviteesRows } = await supabase
        .from("family_event_invitees")
        .select("event_id, family_member_id, family_members(id, name)")
        .in("event_id", eventIds);

      const inviteesByEventId = new Map<string, { family_member_id: string; family_members: { id: string; name: string } | null }[]>();
      for (const row of inviteesRows ?? []) {
        const ev = row as { event_id: string; family_member_id: string; family_members: { id: string; name: string } | { id: string; name: string }[] | null };
        const list = inviteesByEventId.get(ev.event_id) ?? [];
        const fm = Array.isArray(ev.family_members) ? ev.family_members[0] : ev.family_members;
        list.push({ family_member_id: ev.family_member_id, family_members: fm ?? null });
        inviteesByEventId.set(ev.event_id, list);
      }

      events = rawEvents.map((e) => ({
        ...e,
        family_event_invitees: inviteesByEventId.get(e.id) ?? [],
      })) as EventRow[];
    } else {
      events = rawEvents as EventRow[];
    }
    }
  } catch {
    events = [];
  }

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
        <AddEventForm members={members} />
      </div>

      {!events?.length ? (
        <EmptyState
          icon="📅"
          headline="No events yet"
          description="Add your family's important dates so you never miss a celebration!"
          actionLabel="+ Add event"
          onAction={() => document.querySelector<HTMLButtonElement>("[data-add-event]")?.click()}
        />
      ) : (
        <EventsList events={events} members={members} />
      )}
    </div>
  );
}
