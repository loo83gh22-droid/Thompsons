import Link from "next/link";

type Stats = {
  memberCount: number;
  journalCount: number;
  voiceMemoCount: number;
  timeCapsuleCount: number;
  storyCount: number;
  lastActivityBy: string | null;
  lastActivityAt: string | null;
};

type StatCardProps = {
  count: number;
  icon: string;
  singular: string;
  plural: string;
  description: string;
  href: string;
};

function StatCard({ count, icon, singular, plural, description, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group relative rounded-xl border border-[var(--border)] bg-[var(--background)]/60 p-3 min-[400px]:p-4 transition-all duration-200 hover:border-[var(--accent)]/40 hover:shadow-md"
    >
      <div className="flex items-start gap-2 min-[400px]:gap-3">
        <span className="flex h-8 w-8 min-[400px]:h-10 min-[400px]:w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-lg min-[400px]:text-xl">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xl min-[400px]:text-2xl font-bold tabular-nums text-[var(--foreground)]">{count.toLocaleString()}</p>
          <p className="text-xs min-[400px]:text-sm font-medium text-[var(--foreground)]/80">{count === 1 ? singular : plural}</p>
          <p className="mt-0.5 text-xs text-[var(--muted)] hidden min-[400px]:block">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export function DashboardStats({ stats }: { stats: Stats }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 min-[500px]:p-6">
      <div className="flex flex-col gap-1 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
        <div>
          <h2 className="font-display text-base min-[400px]:text-lg font-semibold text-[var(--foreground)]">Your family&apos;s story so far</h2>
          <p className="mt-0.5 text-xs min-[400px]:text-sm text-[var(--muted)]">Every number is a moment that will last forever.</p>
        </div>
        <Link href="/dashboard/timeline" className="shrink-0 text-sm font-medium text-[var(--accent)] hover:underline">
          View timeline →
        </Link>
      </div>
      <div className="mt-4 min-[500px]:mt-5 grid grid-cols-2 gap-2 min-[400px]:gap-3 min-[500px]:grid-cols-3">
        <StatCard
          count={stats.memberCount}
          icon="👨‍👩‍👧‍👦"
          singular="member"
          plural="members"
          description="sharing this space"
          href="/dashboard/our-family"
        />
        <StatCard
          count={stats.journalCount}
          icon="📔"
          singular="journal entry"
          plural="journal entries"
          description="stories written"
          href="/dashboard/journal"
        />
        <StatCard
          count={stats.voiceMemoCount}
          icon="🎙️"
          singular="voice memo"
          plural="voice memos"
          description="voices preserved"
          href="/dashboard/voice-memos"
        />
        <StatCard
          count={stats.timeCapsuleCount}
          icon="✉️"
          singular="time capsule"
          plural="time capsules"
          description="letters to the future"
          href="/dashboard/time-capsules"
        />
        <StatCard
          count={stats.storyCount}
          icon="📖"
          singular="story"
          plural="stories"
          description="chapters of history"
          href="/dashboard/stories"
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
