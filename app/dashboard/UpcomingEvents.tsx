import Link from "next/link";
import { getCategoryColor, getCategoryLabel } from "./events/constants";

type EventRow = { id: string; title: string; event_date: string; category: string };

function formatCompact(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return `In ${diff} days`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function UpcomingEvents({ events }: { events: EventRow[] }) {
  const next3 = events.slice(0, 3);

  if (next3.length === 0) {
    return (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
          Upcoming Events
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          No events scheduled. Add one!
        </p>
        <Link
          href="/dashboard/events"
          className="mt-3 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
        >
          View all events
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--accent)]/20 bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
          Upcoming Events
        </h2>
        <Link href="/dashboard/events" className="text-sm font-medium text-[var(--accent)] hover:underline">
          View all events
        </Link>
      </div>
      <ul className="mt-3 space-y-3">
        {next3.map((e) => {
          const label = formatCompact(e.event_date);
          const isImminent = label === "Today" || label === "Tomorrow";
          return (
            <li key={e.id}>
              <Link
                href="/dashboard/events"
                className={`block rounded-lg border p-2 transition-colors hover:bg-[var(--surface-hover)] ${
                  isImminent
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 hover:border-[var(--accent)]/60"
                    : "border-[var(--border)] bg-[var(--background)]/50 hover:border-[var(--accent)]/40"
                }`}
              >
                <span className="font-medium text-[var(--foreground)]">{e.title}</span>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getCategoryColor(e.category)}`}>
                    {getCategoryLabel(e.category)}
                  </span>
                  <span className={`text-xs ${isImminent ? "font-semibold text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                    {label}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
