import Link from "next/link";

const actions = [
  { href: "/dashboard/journal/new", label: "Write a Journal Entry", icon: "📔" },
  { href: "/dashboard/photos", label: "Upload Photos", icon: "📷" },
  { href: "/dashboard/voice-memos", label: "Record Voice Memo", icon: "🎙️" },
  { href: "/dashboard/stories/new", label: "Share a Story", icon: "📖" },
  { href: "/dashboard/events", label: "Add an Event", icon: "🎂" },
];

export function QuickActions() {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
        Quick Actions
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Jump straight into creating something new.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all duration-200 hover:border-[var(--primary)]/40 hover:shadow-md hover:bg-[var(--surface-hover)]"
          >
            <span aria-hidden="true">{a.icon}</span>
            {a.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
