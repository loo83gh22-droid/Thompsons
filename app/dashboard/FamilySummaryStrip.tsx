import Link from "next/link";

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type MemberSummary = { id: string; name: string; avatar_url: string | null };

export function FamilySummaryStrip({
  members,
  photoCount,
  journalCount,
  voiceMemoCount,
  lastActivityAt,
}: {
  members: MemberSummary[];
  photoCount: number;
  journalCount: number;
  voiceMemoCount: number;
  lastActivityAt: string | null;
}) {
  const displayMembers = members.slice(0, 8);

  return (
    <section
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6"
      aria-label="Family summary"
    >
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <Link
          href="/dashboard/members"
          className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--accent)]"
        >
          <div className="flex -space-x-2">
            {displayMembers.length === 0 ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--accent)]/30 text-xs font-semibold text-[var(--accent)]">
                ?
              </div>
            ) : (
              displayMembers.map((m) => (
                <div
                  key={m.id}
                  className="h-9 w-9 overflow-hidden rounded-full border-2 border-[var(--surface)] bg-[var(--background)]"
                  title={m.name}
                >
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--accent)]">
                      {initials(m.name)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
          <span className="text-sm font-medium">
            {members.length} member{members.length === 1 ? "" : "s"}
          </span>
        </Link>
        <span className="text-sm text-[var(--muted)]">
          {photoCount} photos · {journalCount} journal · {voiceMemoCount} voice memos
        </span>
        {lastActivityAt && (
          <span className="text-xs text-[var(--muted)] sm:ml-auto">
            Last active: {formatTimeAgo(lastActivityAt)}
          </span>
        )}
      </div>
    </section>
  );
}
