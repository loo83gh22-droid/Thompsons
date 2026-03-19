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
  accentColor: string;
  bgColor: string;
};

function StatCard({ count, icon, singular, plural, description, href, accentColor, bgColor }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl p-4 min-[400px]:p-5 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
      style={{ backgroundColor: bgColor }}
    >
      {/* Background glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${accentColor}15, transparent 70%)`,
        }}
      />
      <span className="relative text-3xl min-[400px]:text-4xl">{icon}</span>
      <p
        className="relative mt-2 text-3xl min-[400px]:text-4xl font-bold tabular-nums"
        style={{ color: accentColor }}
      >
        {count.toLocaleString()}
      </p>
      <p className="relative mt-0.5 text-sm font-semibold text-[var(--foreground)]">
        {count === 1 ? singular : plural}
      </p>
      <p className="relative mt-0.5 text-xs text-[var(--muted)]">{description}</p>
    </Link>
  );
}

export function DashboardStats({ stats }: { stats: Stats }) {
  const total = stats.memberCount + stats.journalCount + stats.voiceMemoCount + stats.timeCapsuleCount + stats.storyCount;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      {/* Decorative gradient bar at top */}
      <div
        className="h-1.5"
        style={{
          background: "linear-gradient(90deg, var(--primary), var(--accent), var(--primary))",
        }}
      />

      <div className="p-5 min-[500px]:p-6">
        <div className="flex flex-col gap-2 min-[500px]:flex-row min-[500px]:items-center min-[500px]:justify-between">
          <div>
            <h2 className="font-display text-xl min-[400px]:text-2xl font-bold text-[var(--foreground)]">
              Your family&apos;s story so far
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {total.toLocaleString()} moments captured and counting.
            </p>
          </div>
          <Link
            href="/dashboard/timeline"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-4 py-2 text-sm font-semibold text-[var(--accent)] transition-all hover:bg-[var(--accent)]/15 hover:border-[var(--accent)]/50"
          >
            View timeline
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 min-[500px]:grid-cols-3 min-[700px]:grid-cols-5">
          <StatCard
            count={stats.memberCount}
            icon="👨‍👩‍👧‍👦"
            singular="member"
            plural="members"
            description="sharing this space"
            href="/dashboard/our-family"
            accentColor="hsl(160, 36%, 30%)"
            bgColor="hsl(160, 25%, 95%)"
          />
          <StatCard
            count={stats.journalCount}
            icon="📔"
            singular="entry"
            plural="entries"
            description="moments captured"
            href="/dashboard/journal"
            accentColor="hsl(24, 65%, 48%)"
            bgColor="hsl(24, 40%, 95%)"
          />
          <StatCard
            count={stats.voiceMemoCount}
            icon="🎙️"
            singular="voice memo"
            plural="voice memos"
            description="voices preserved"
            href="/dashboard/voice-memos"
            accentColor="hsl(260, 45%, 50%)"
            bgColor="hsl(260, 30%, 95%)"
          />
          <StatCard
            count={stats.timeCapsuleCount}
            icon="✉️"
            singular="capsule"
            plural="capsules"
            description="letters to the future"
            href="/dashboard/time-capsules"
            accentColor="hsl(200, 50%, 42%)"
            bgColor="hsl(200, 35%, 95%)"
          />
          <StatCard
            count={stats.storyCount}
            icon="📖"
            singular="story"
            plural="stories"
            description="chapters of history"
            href="/dashboard/stories"
            accentColor="hsl(340, 45%, 45%)"
            bgColor="hsl(340, 30%, 95%)"
          />
        </div>

        {stats.lastActivityBy && stats.lastActivityAt && (
          <p className="mt-5 flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            Last updated by {stats.lastActivityBy} · {new Date(stats.lastActivityAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>
    </section>
  );
}
