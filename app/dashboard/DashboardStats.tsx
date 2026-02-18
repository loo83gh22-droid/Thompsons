import Link from "next/link";

type Stats = {
  memberCount: number;
  photoCount: number;
  journalCount: number;
  voiceMemoCount: number;
  timeCapsuleCount: number;
  storyCount: number;
  lastActivityBy: string | null;
  lastActivityAt: string | null;
};

// Milestones for each stat — returns a celebratory label when one is hit
function getMilestone(count: number, thresholds: number[]): number | null {
  for (const t of thresholds) {
    if (count === t) return t;
  }
  return null;
}

const PHOTO_MILESTONES = [1, 10, 25, 50, 100, 250, 500];
const JOURNAL_MILESTONES = [1, 5, 10, 25, 50, 100];
const VOICE_MILESTONES = [1, 5, 10, 25, 50];
const CAPSULE_MILESTONES = [1, 5, 10, 25];
const STORY_MILESTONES = [1, 5, 10];

type StatCardProps = {
  count: number;
  icon: string;
  singular: string;
  plural: string;
  description: string;
  href: string;
  milestones: number[];
};

function StatCard({ count, icon, singular, plural, description, href, milestones }: StatCardProps) {
  const milestone = getMilestone(count, milestones);
  return (
    <Link
      href={href}
      className="group relative rounded-xl border border-[var(--border)] bg-[var(--background)]/60 p-4 transition-all duration-200 hover:border-[var(--accent)]/40 hover:shadow-md"
    >
      {milestone !== null && (
        <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs shadow-sm" title={`🎉 ${milestone} ${plural} milestone!`}>
          ✨
        </span>
      )}
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-xl">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold tabular-nums text-[var(--foreground)]">{count.toLocaleString()}</p>
          <p className="text-sm font-medium text-[var(--foreground)]/80">{count === 1 ? singular : plural}</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{description}</p>
        </div>
      </div>
      {milestone !== null && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 border border-amber-200">
          🎉 {milestone} {count === 1 ? singular : plural} milestone!
        </p>
      )}
    </Link>
  );
}

export function DashboardStats({ stats }: { stats: Stats }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">Your family&apos;s story so far</h2>
          <p className="mt-0.5 text-sm text-[var(--muted)]">Every number is a moment that will last forever.</p>
        </div>
        <Link href="/dashboard/timeline" className="shrink-0 text-sm font-medium text-[var(--accent)] hover:underline">
          View timeline →
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 min-[500px]:grid-cols-3">
        <StatCard
          count={stats.memberCount}
          icon="👨‍👩‍👧‍👦"
          singular="member"
          plural="members"
          description="sharing this space"
          href="/dashboard/our-family"
          milestones={[1, 3, 5, 10]}
        />
        <StatCard
          count={stats.photoCount}
          icon="📷"
          singular="photo"
          plural="photos"
          description="moments captured"
          href="/dashboard/photos"
          milestones={PHOTO_MILESTONES}
        />
        <StatCard
          count={stats.journalCount}
          icon="📔"
          singular="journal entry"
          plural="journal entries"
          description="stories written"
          href="/dashboard/journal"
          milestones={JOURNAL_MILESTONES}
        />
        <StatCard
          count={stats.voiceMemoCount}
          icon="🎙️"
          singular="voice memo"
          plural="voice memos"
          description="voices preserved"
          href="/dashboard/voice-memos"
          milestones={VOICE_MILESTONES}
        />
        <StatCard
          count={stats.timeCapsuleCount}
          icon="✉️"
          singular="time capsule"
          plural="time capsules"
          description="letters to the future"
          href="/dashboard/time-capsules"
          milestones={CAPSULE_MILESTONES}
        />
        <StatCard
          count={stats.storyCount}
          icon="📖"
          singular="story"
          plural="stories"
          description="chapters of history"
          href="/dashboard/stories"
          milestones={STORY_MILESTONES}
        />
      </div>
      {stats.lastActivityBy && stats.lastActivityAt && (
        <p className="mt-4 text-xs text-[var(--muted)]">
          Last updated by {stats.lastActivityBy} · {new Date(stats.lastActivityAt).toLocaleDateString()}
        </p>
      )}
    </section>
  );
}
