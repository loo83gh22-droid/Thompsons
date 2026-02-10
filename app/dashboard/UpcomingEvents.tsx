import Link from "next/link";

type EventRow = { id: string; title: string; event_date: string; category: string };

export function UpcomingEvents({ events }: { events: EventRow[] }) {
  if (events.length === 0) return null;
  return (
    <section className="rounded-xl border border-[var(--accent)]/20 bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">Coming up</h2>
        <Link href="/dashboard/events" className="text-sm font-medium text-[var(--accent)] hover:underline">
          All events →
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {events.slice(0, 5).map((e) => (
          <li key={e.id} className="flex items-center justify-between text-sm">
            <span className="font-medium text-[var(--foreground)]">{e.title}</span>
            <span className="text-[var(--muted)]">{e.event_date}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
