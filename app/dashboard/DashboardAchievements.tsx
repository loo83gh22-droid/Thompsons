"use client";

export type BadgeDef = {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (stats: FamilyStats) => boolean;
  progress?: (stats: FamilyStats) => { current: number; target: number };
};

export type FamilyStats = {
  memberCount: number;
  photoCount: number;
  journalCount: number;
  voiceMemoCount: number;
  timeCapsuleCount: number;
  storyCount: number;
};

const BADGES: BadgeDef[] = [
  {
    id: "photos-10",
    name: "First album",
    description: "10 photos uploaded",
    icon: "📷",
    check: (s) => s.photoCount >= 10,
    progress: (s) => ({ current: s.photoCount, target: 10 }),
  },
  {
    id: "photos-50",
    name: "Memory keeper",
    description: "50 photos uploaded",
    icon: "🖼️",
    check: (s) => s.photoCount >= 50,
    progress: (s) => ({ current: s.photoCount, target: 50 }),
  },
  {
    id: "photos-100",
    name: "Family archivist",
    description: "100 photos uploaded",
    icon: "📸",
    check: (s) => s.photoCount >= 100,
    progress: (s) => ({ current: s.photoCount, target: 100 }),
  },
  {
    id: "journal-5",
    name: "Story starter",
    description: "5 journal entries",
    icon: "📔",
    check: (s) => s.journalCount >= 5,
    progress: (s) => ({ current: s.journalCount, target: 5 }),
  },
  {
    id: "journal-10",
    name: "Chronicler",
    description: "10 journal entries",
    icon: "📖",
    check: (s) => s.journalCount >= 10,
    progress: (s) => ({ current: s.journalCount, target: 10 }),
  },
  {
    id: "journal-25",
    name: "Family historian",
    description: "25 journal entries",
    icon: "📜",
    check: (s) => s.journalCount >= 25,
    progress: (s) => ({ current: s.journalCount, target: 25 }),
  },
  {
    id: "members-5",
    name: "Full house",
    description: "5 family members have contributed",
    icon: "👨‍👩‍👧‍👦",
    check: (s) => s.memberCount >= 5,
  },
  {
    id: "stories-1",
    name: "First story",
    description: "1 family story published",
    icon: "✨",
    check: (s) => s.storyCount >= 1,
    progress: (s) => ({ current: s.storyCount, target: 1 }),
  },
  {
    id: "stories-5",
    name: "Storyteller",
    description: "5 family stories",
    icon: "📚",
    check: (s) => s.storyCount >= 5,
    progress: (s) => ({ current: s.storyCount, target: 5 }),
  },
];

function getNextBadge(stats: FamilyStats): BadgeDef | null {
  for (const b of BADGES) {
    if (!b.check(stats) && b.progress) return b;
  }
  return null;
}

export function DashboardAchievements({ stats }: { stats: FamilyStats }) {
  const unlocked = BADGES.filter((b) => b.check(stats));
  const next = getNextBadge(stats);

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">Achievements</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {unlocked.map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-2 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-2"
            title={b.description}
          >
            <span className="text-xl" aria-hidden="true">{b.icon}</span>
            <span className="text-sm font-medium text-[var(--foreground)]">{b.name}</span>
          </div>
        ))}
      </div>
      {next && next.progress && (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Next: <strong className="text-[var(--foreground)]">{next.name}</strong> — {next.progress(stats).current} / {next.progress(stats).target} {next.id.startsWith("photos") ? "photos" : next.id.startsWith("journal") ? "entries" : next.id.startsWith("stories") ? "stories" : ""}
        </p>
      )}
      {unlocked.length === 0 && !next && (
        <p className="mt-2 text-sm text-[var(--muted)]">Add photos, journal entries, or stories to unlock badges.</p>
      )}
    </section>
  );
}
