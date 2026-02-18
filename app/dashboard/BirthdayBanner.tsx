import Link from "next/link";

export type BirthdayPerson = {
  id: string;
  name: string;
  turningAge: number | null; // null if birth year unknown
  daysUntil: number; // 0 = today, 1 = tomorrow, etc.
};

function BirthdayCard({ person }: { person: BirthdayPerson }) {
  const isToday = person.daysUntil === 0;
  const isTomorrow = person.daysUntil === 1;

  const label = isToday
    ? "Today! 🎂"
    : isTomorrow
    ? "Tomorrow"
    : `In ${person.daysUntil} days`;

  const ageText =
    person.turningAge !== null
      ? isToday
        ? `Turning ${person.turningAge} today!`
        : `Turning ${person.turningAge}`
      : isToday
      ? "It's their birthday!"
      : "Birthday coming up";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
        isToday
          ? "bg-amber-50 border border-amber-300"
          : "bg-[var(--surface)] border border-[var(--border)]"
      }`}
    >
      <span className="text-3xl" aria-hidden="true">
        {isToday ? "🎂" : "🎈"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[var(--foreground)]">{person.name}</p>
        <p className="text-sm text-[var(--muted)]">{ageText}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
          isToday
            ? "bg-amber-400 text-white"
            : isTomorrow
            ? "bg-[var(--accent)]/20 text-[var(--accent)]"
            : "bg-[var(--surface-hover)] text-[var(--muted)]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export function BirthdayBanner({ birthdays }: { birthdays: BirthdayPerson[] }) {
  if (birthdays.length === 0) return null;

  const hasToday = birthdays.some((b) => b.daysUntil === 0);

  return (
    <section
      className={`rounded-2xl border p-5 ${
        hasToday
          ? "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50"
          : "border-[var(--accent)]/20 bg-gradient-to-br from-[var(--accent)]/5 to-[var(--surface)]"
      }`}
      aria-label="Upcoming birthdays"
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">{hasToday ? "🥳" : "🎉"}</span>
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
            {hasToday ? "It's a birthday!" : "Birthdays coming up"}
          </h2>
          <p className="text-sm text-[var(--muted)]">
            {hasToday
              ? "Make someone feel extra special today."
              : "Don't forget to celebrate!"}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {birthdays.map((person) => (
          <BirthdayCard key={person.id} person={person} />
        ))}
      </div>
      <Link
        href="/dashboard/our-family"
        className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
      >
        View all family members →
      </Link>
    </section>
  );
}
