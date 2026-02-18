"use client";

export type WeeklyStreakProps = {
  /** ISO date strings (YYYY-MM-DD) of days with at least one family activity in the past 7 days */
  activeDays: string[];
  /** Total consecutive weeks with activity (for the streak count) */
  weekStreak: number;
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getStreakMessage(weeks: number): string {
  if (weeks === 0) return "Start your family's streak this week!";
  if (weeks === 1) return "Great start — keep it going next week! 🌱";
  if (weeks === 2) return "Two weeks running — you're building something special! 🌟";
  if (weeks === 3) return "Three weeks! Your family is on fire 🔥";
  if (weeks < 8) return `${weeks} weeks and counting — incredible! 🏆`;
  return `${weeks} weeks! Your family are memory-making legends 🥇`;
}

export function WeeklyStreak({ activeDays, weekStreak }: WeeklyStreakProps) {
  // Build the last 7 days starting from the most recent Sunday
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build an array for the current week Sun → Sat
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const isPast = d <= today;
    const isActive = activeDays.includes(iso);
    const isToday = iso === today.toISOString().slice(0, 10);
    return { iso, label: DAY_LABELS[i], isPast, isActive, isToday };
  });

  const activeDaysThisWeek = week.filter((d) => d.isActive).length;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
            Weekly Streak
          </h2>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            {getStreakMessage(weekStreak)}
          </p>
        </div>
        {weekStreak > 0 && (
          <div className="flex flex-col items-center rounded-xl bg-[var(--accent)]/10 px-3 py-2 text-center">
            <span className="text-xl font-bold tabular-nums text-[var(--accent)]">
              {weekStreak}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--accent)]/70">
              {weekStreak === 1 ? "week" : "weeks"}
            </span>
          </div>
        )}
      </div>

      {/* Day bubbles */}
      <div className="mt-5 flex items-end justify-between gap-1">
        {week.map((day) => (
          <div key={day.iso} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all duration-200 ${
                day.isActive
                  ? "bg-[var(--accent)] text-white shadow-md"
                  : day.isToday
                  ? "border-2 border-[var(--accent)] text-[var(--accent)] bg-transparent"
                  : day.isPast
                  ? "bg-[var(--surface-hover)] text-[var(--muted)]"
                  : "bg-[var(--surface)] text-[var(--muted)]/40"
              }`}
              title={day.isActive ? `Active on ${day.iso}` : undefined}
            >
              {day.isActive ? "✓" : day.label}
              {day.isToday && !day.isActive && (
                <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent)]" />
              )}
            </div>
            <span className="text-[10px] text-[var(--muted)]">{day.label}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-1">
          <span>{activeDaysThisWeek} of 7 days active this week</span>
          {activeDaysThisWeek === 7 && (
            <span className="font-semibold text-[var(--accent)]">Perfect week! 🎉</span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-hover)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${(activeDaysThisWeek / 7) * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
