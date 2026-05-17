/**
 * StarterProgress — small 3-step progress indicator.
 *
 * Replaces the old "Weekly Streak" widget (killed in PR 114) with
 * something gentler: a finite 1/3 → 2/3 → 3/3 bar that reflects the
 * three activation milestones (first entry · first photo · first
 * member invited) and then quietly disappears once all three are done.
 *
 * Designed to live directly above OnboardingChecklist on the
 * dashboard. No streak guilt, no "you've broken your X-day run" —
 * just a visible signal that the user is making progress.
 */
export function StarterProgress({
  journalCount,
  photoCount,
  voiceMemoCount,
  memberCount,
}: {
  journalCount: number;
  photoCount: number;
  voiceMemoCount: number;
  memberCount: number;
}) {
  // Mirrors OnboardingChecklist step logic — "any entry" counts toward step 1.
  const step1Done = journalCount + photoCount + voiceMemoCount >= 1; // first entry
  const step2Done = photoCount >= 1; // first photo
  const step3Done = memberCount >= 2; // invited someone

  const stepsDone = [step1Done, step2Done, step3Done].filter(Boolean).length;

  // Once everything's done, hide forever. OnboardingChecklist handles
  // the confetti celebration; we just quietly vanish.
  if (stepsDone >= 3) return null;

  const steps = [
    { label: "First entry", done: step1Done },
    { label: "Add a photo", done: step2Done },
    { label: "Invite someone", done: step3Done },
  ];

  return (
    <section
      aria-label={`Getting started: step ${stepsDone + 1} of 3`}
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 sm:px-5 sm:py-4"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[var(--foreground)]">
          Setting up your Nest
        </span>
        <span className="text-xs font-medium text-[var(--muted)]">
          {stepsDone} of 3
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2" aria-hidden>
        {steps.map((s, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
              s.done ? "bg-[var(--accent)]" : "bg-[var(--border)]"
            }`}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
        {steps.map((s) => (
          <li
            key={s.label}
            className={`flex items-center gap-1.5 ${
              s.done ? "text-[var(--foreground)]" : ""
            }`}
          >
            <span aria-hidden>{s.done ? "✓" : "○"}</span>
            <span>{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
