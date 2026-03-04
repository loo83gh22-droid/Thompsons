import Link from "next/link";
import Image from "next/image";

export type HighlightItem = {
  type: "photo" | "journal" | "story" | "voice_memo" | "message";
  id: string;
  title: string | null;
  imageUrl: string | null;
  createdAt: string;
  eventDate?: string | null;
  href: string;
};

const typeLabels: Record<HighlightItem["type"], string> = {
  photo: "Photo",
  journal: "Journal Entry",
  story: "Story",
  voice_memo: "Voice Memo",
  message: "Message",
};

const typeIcons: Record<HighlightItem["type"], string> = {
  photo: "🖼️",
  journal: "📔",
  story: "📖",
  voice_memo: "🎙️",
  message: "💌",
};

export function FamilyHighlight({ item }: { item: HighlightItem | null }) {
  if (!item) return null;

  const displayDate = item.eventDate ?? item.createdAt;
  const dateStr = new Date(displayDate + (displayDate.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
        Memory of the Day
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        A look back at a moment from your family.
      </p>
      <Link
        href={item.href}
        className="mt-4 flex gap-4 rounded-xl bg-[var(--surface)] p-4 transition-all duration-200 hover:bg-[var(--surface-hover)] hover:shadow-md"
      >
        {item.imageUrl ? (
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--border)]">
            <Image
              src={item.imageUrl}
              alt={item.title || "Family memory"}
              fill
              unoptimized
              className="object-cover"
              sizes="80px"
            />
          </div>
        ) : (
          <span className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-3xl">
            {typeIcons[item.type]}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
            {typeLabels[item.type]}
          </span>
          {item.title && (
            <p className="mt-1.5 truncate font-medium text-[var(--foreground)]">
              {item.title}
            </p>
          )}
          <p className="mt-1 text-xs text-[var(--muted)]">{dateStr}</p>
        </div>
      </Link>
    </section>
  );
}
