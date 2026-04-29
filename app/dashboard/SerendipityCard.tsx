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

export type OnThisDayItem = {
  type: "journal" | "voice_memo" | "story" | "photo";
  id: string;
  title: string | null;
  memberName: string | null;
  createdAt: string;
  href: string;
  yearsAgo: number;
};

/**
 * SerendipityCard — a single rotating daily-surprise widget that
 * replaces what used to be four separate widgets on the dashboard
 * home (Memory of the Day, On This Day, Gratitude of the Day, Daily
 * Inspiration). Whichever moment-types have content for this family
 * get added to a pool; we pick one based on the day-seed so the
 * surface rotates day-to-day. Only one card is shown at a time, so
 * the dashboard stays anchored on "In the Nest" without four
 * competing boxes below it.
 */

type Gratitude = { content: string; member_name: string };

type Moment =
  | { kind: "highlight"; item: HighlightItem }
  | { kind: "on-this-day"; items: OnThisDayItem[] }
  | { kind: "gratitude"; post: Gratitude }
  | { kind: "inspiration"; tip: { text: string; href: string; cta: string } };

// Tips lean into permission and lightness, not assignments. Tone matters
// for a busy parent — "do this five things" is the wrong vibe; "one
// sentence counts" is right.
const INSPIRATION_TIPS: Array<{ text: string; href: string; cta: string }> = [
  { text: "Just one sentence about today counts. It becomes a memory.", href: "/dashboard/journal/new", cta: "Write a line" },
  { text: "Pick a photo from this week. Drop it in. That's it.", href: "/dashboard/photos", cta: "Add a photo" },
  { text: "Hit record. Say something you'd want them to hear someday.", href: "/dashboard/voice-memos", cta: "Record a memo" },
  { text: "What's a thing one of your kids said this week that made you laugh?", href: "/dashboard/journal/new", cta: "Write it down" },
  { text: "A letter to your kid, sealed for later. Even three lines is plenty.", href: "/dashboard/time-capsules/new", cta: "Open a capsule" },
  { text: "Drop a pin on a place that means something — a beach, a cabin, the diner.", href: "/dashboard/map", cta: "Open the map" },
  { text: "The bedtime song. Record it tonight. Future you, future them — both grateful.", href: "/dashboard/voice-memos", cta: "Record a memo" },
  { text: "One small win from this week. Five seconds to write, decades to keep.", href: "/dashboard/journal/new", cta: "Write a line" },
  { text: "A favourite — a song, a book, a meal right now. Snapshot of who you are this season.", href: "/dashboard/favourites", cta: "Add a favourite" },
  { text: "What's one tradition you don't want to forget? Write the why behind it.", href: "/dashboard/traditions", cta: "Capture it" },
];

export function SerendipityCard({
  highlight,
  onThisDayItems,
  gratitudeOfTheDay,
  daySeed,
}: {
  highlight: HighlightItem | null;
  onThisDayItems: OnThisDayItem[];
  gratitudeOfTheDay: Gratitude | null;
  daySeed: number;
}) {
  const moments: Moment[] = [];

  // On This Day is the highest-emotion moment when it exists — show it
  // first in the pool so it rotates in roughly first when active.
  if (onThisDayItems.length > 0) {
    moments.push({ kind: "on-this-day", items: onThisDayItems });
  }
  if (highlight) {
    moments.push({ kind: "highlight", item: highlight });
  }
  if (gratitudeOfTheDay) {
    moments.push({ kind: "gratitude", post: gratitudeOfTheDay });
  }
  // Inspiration is the always-available fallback so the card never
  // disappears even if a family has no content yet.
  moments.push({
    kind: "inspiration",
    tip: INSPIRATION_TIPS[daySeed % INSPIRATION_TIPS.length],
  });

  const pick = moments[daySeed % moments.length];

  return (
    <section
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6"
      aria-label="Today's family moment"
    >
      {pick.kind === "highlight" && <HighlightView item={pick.item} />}
      {pick.kind === "on-this-day" && <OnThisDayView items={pick.items} />}
      {pick.kind === "gratitude" && <GratitudeView post={pick.post} />}
      {pick.kind === "inspiration" && <InspirationView tip={pick.tip} />}
    </section>
  );
}

/* ── Sub-views ──────────────────────────────────────────────────── */

function CardHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">
        {kicker}
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold text-[var(--foreground)]">
        {title}
      </h2>
    </>
  );
}

function HighlightView({ item }: { item: HighlightItem }) {
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
  const displayDate = item.eventDate ?? item.createdAt;
  const dateStr = new Date(
    displayDate + (displayDate.length === 10 ? "T12:00:00" : "")
  ).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      <CardHeader kicker="Memory of the day" title="A moment from your family" />
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
    </>
  );
}

function OnThisDayView({ items }: { items: OnThisDayItem[] }) {
  // Pick the most-recent year's first item — the Serendipity card
  // shows ONE moment, not the full list. Users can click into Timeline
  // to see all "on this day" entries.
  const sorted = [...items].sort((a, b) => a.yearsAgo - b.yearsAgo);
  const item = sorted[0];
  if (!item) return null;

  const typeIcons: Record<OnThisDayItem["type"], string> = {
    journal: "📔",
    voice_memo: "🎙️",
    story: "📖",
    photo: "📷",
  };
  const typeVerb: Record<OnThisDayItem["type"], string> = {
    journal: "wrote a journal entry",
    voice_memo: "recorded a voice memo",
    story: "shared a story",
    photo: "added photos",
  };
  const yearsAgoLabel = item.yearsAgo === 1 ? "1 year ago today" : `${item.yearsAgo} years ago today`;

  return (
    <>
      <CardHeader kicker="On this day" title={yearsAgoLabel} />
      <Link
        href={item.href}
        className="mt-4 flex items-start gap-3 rounded-xl bg-[var(--surface)] p-4 transition-all duration-200 hover:bg-[var(--surface-hover)] hover:shadow-md"
      >
        <span
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-2xl"
          aria-hidden="true"
        >
          {typeIcons[item.type]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[var(--muted)]">
            {item.memberName ? (
              <>
                <span className="font-medium text-[var(--foreground)]">{item.memberName}</span>{" "}
                {typeVerb[item.type]}
              </>
            ) : (
              <span className="capitalize">{typeVerb[item.type]}</span>
            )}
          </p>
          {item.title && (
            <p className="mt-0.5 truncate font-medium text-[var(--foreground)]">
              {item.title}
            </p>
          )}
        </div>
      </Link>
    </>
  );
}

function GratitudeView({ post }: { post: Gratitude }) {
  return (
    <>
      <CardHeader kicker="Gratitude of the day" title="What someone is grateful for" />
      <Link
        href="/dashboard/gratitude-board"
        className="mt-4 block rounded-xl bg-[var(--surface)] p-4 transition-all duration-200 hover:bg-[var(--surface-hover)] hover:shadow-md"
      >
        <p className="text-[var(--foreground)]">&ldquo;{post.content}&rdquo;</p>
        <p className="mt-2 text-xs text-[var(--muted)]">— {post.member_name}</p>
      </Link>
    </>
  );
}

function InspirationView({ tip }: { tip: { text: string; href: string; cta: string } }) {
  return (
    <>
      <CardHeader kicker="A little nudge" title="Capture something today" />
      <div className="mt-4 flex gap-3 rounded-xl bg-[var(--surface)] p-4">
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-xl"
          aria-hidden="true"
        >
          💡
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-sm leading-relaxed text-[var(--foreground)]">{tip.text}</p>
          <Link
            href={tip.href}
            className="self-start rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-[var(--background)] transition-all duration-200 hover:brightness-110 hover:shadow-md"
          >
            {tip.cta} →
          </Link>
        </div>
      </div>
    </>
  );
}
