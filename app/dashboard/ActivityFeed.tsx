import Link from "next/link";
import Image from "next/image";

export type ActivityItem = {
  type: "photo" | "journal" | "voice_memo" | "message";
  id: string;
  createdAt: string;
  title?: string | null;
  thumbnailUrl?: string | null;
  memberName?: string | null;
  memberRelationship?: string | null;
  durationSeconds?: number | null;
  href: string;
};

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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const icons: Record<ActivityItem["type"], string> = {
    photo: "🖼️",
    journal: "📔",
    voice_memo: "🎙️",
    message: "💌",
  };
  return (
    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--surface-hover)] text-2xl">
      {icons[type]}
    </span>
  );
}

function ActivityCard({ item }: { item: ActivityItem }) {
  const memberLabel =
    item.memberName && item.memberRelationship
      ? `${item.memberName} (${item.memberRelationship})`
      : item.memberName ?? "Someone";

  return (
    <Link
      href={item.href}
      className="group flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-200 hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)] hover:shadow-lg hover:shadow-black/20 md:gap-4"
    >
      {item.type === "photo" && item.thumbnailUrl ? (
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--border)]">
          <Image
            src={item.thumbnailUrl}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
      ) : (
        <ActivityIcon type={item.type} />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--muted)]">
          {item.type === "photo" && !item.memberName ? (
            "A photo was added"
          ) : (
            <>
              <span className="font-medium text-[var(--accent)]">{memberLabel}</span>{" "}
              {{
                photo: "uploaded a photo",
                journal: "wrote a journal entry",
                voice_memo: "recorded a voice memo",
                message: "sent a message",
              }[item.type]}
            </>
          )}
        </p>
        {item.title && (
          <p className="mt-0.5 truncate font-medium text-[var(--foreground)]">{item.title}</p>
        )}
        {item.type === "voice_memo" && item.durationSeconds != null && (
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Duration: {formatDuration(item.durationSeconds)}
          </p>
        )}
        <p className="mt-1 text-xs text-[var(--muted)]">{formatTimeAgo(item.createdAt)}</p>
      </div>
    </Link>
  );
}

export function ActivityFeed({
  items,
  hasMore,
}: {
  items: ActivityItem[];
  hasMore?: boolean;
}) {
  if (items.length === 0) {
    return (
      <section className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-6 py-12 text-center">
        <span className="text-5xl" role="img" aria-hidden="true">
          👨‍👩‍👧‍👦
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold text-[var(--foreground)]">
          Your family story starts here
        </h2>
        <p className="mt-2 max-w-sm mx-auto text-[var(--muted)]">
          Upload a photo, write a journal entry, or record a voice memo to get started!
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 min-[768px]:grid-cols-2 min-[1024px]:grid-cols-3">
        {items.map((item) => (
          <ActivityCard key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Link
            href="/dashboard/timeline"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            View all activity →
          </Link>
        </div>
      )}
    </section>
  );
}
