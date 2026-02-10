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

export function DashboardStats({ stats }: { stats: Stats }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">Family at a glance</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 min-[500px]:grid-cols-3">
        <div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{stats.memberCount}</p>
          <p className="text-sm text-[var(--muted)]">Members</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{stats.photoCount}</p>
          <p className="text-sm text-[var(--muted)]">Photos</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{stats.journalCount}</p>
          <p className="text-sm text-[var(--muted)]">Journal entries</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{stats.voiceMemoCount}</p>
          <p className="text-sm text-[var(--muted)]">Voice memos</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{stats.timeCapsuleCount}</p>
          <p className="text-sm text-[var(--muted)]">Time capsules</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{stats.storyCount}</p>
          <p className="text-sm text-[var(--muted)]">Stories</p>
        </div>
      </div>
      {stats.lastActivityBy && stats.lastActivityAt && (
        <p className="mt-4 text-xs text-[var(--muted)]">
          Last updated by {stats.lastActivityBy} · {new Date(stats.lastActivityAt).toLocaleDateString()}
        </p>
      )}
      <Link href="/dashboard/timeline" className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
        View timeline →
      </Link>
    </section>
  );
}
