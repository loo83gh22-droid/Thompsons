import { createAdminClient } from "@/src/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Family Nest | Kid View",
};

type Section =
  | "home"
  | "journal"
  | "photos"
  | "events"
  | "family"
  | "recipes"
  | "stories"
  | "voice-memos"
  | "capsules"
  | "traditions"
  | "achievements";

const SECTIONS: { key: Section; label: string; emoji: string }[] = [
  { key: "home", label: "Home", emoji: "🏠" },
  { key: "journal", label: "Journal", emoji: "📖" },
  { key: "photos", label: "Photos", emoji: "📸" },
  { key: "events", label: "Events", emoji: "📅" },
  { key: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { key: "recipes", label: "Recipes", emoji: "🍽️" },
  { key: "stories", label: "Stories", emoji: "📚" },
  { key: "voice-memos", label: "Voice", emoji: "🎙️" },
  { key: "capsules", label: "Letters", emoji: "💌" },
  { key: "traditions", label: "Traditions", emoji: "✨" },
  { key: "achievements", label: "Wins", emoji: "🏆" },
];

function formatDate(d: string | null | undefined, includeYear = true) {
  if (!d) return "";
  const date = new Date(d.includes("T") ? d : d + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

function EmptyState({ emoji, message }: { emoji: string; message: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-8 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="mt-2 text-[var(--muted)]">{message}</p>
    </div>
  );
}

function SectionHeading({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
        {emoji} {title}
      </h2>
      {subtitle && (
        <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>
      )}
    </div>
  );
}

export default async function KidViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { token } = await params;
  const { section: rawSection } = await searchParams;
  const section: Section =
    (SECTIONS.find((s) => s.key === rawSection)?.key as Section) ?? "home";

  // Use admin client to bypass RLS — the token itself is the auth mechanism
  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("family_members")
    .select(
      "id, name, nickname, avatar_url, family_id, kid_access_token, kid_token_expires_at, role"
    )
    .eq("kid_access_token", token)
    .single();

  if (!member) return notFound();

  if (member.kid_token_expires_at) {
    const expires = new Date(member.kid_token_expires_at);
    if (expires < new Date()) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
          <div className="max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <span className="text-5xl">🔒</span>
            <h1 className="mt-4 font-display text-2xl font-bold text-[var(--foreground)]">
              Link Expired
            </h1>
            <p className="mt-2 text-[var(--muted)]">
              This link has expired. Ask a parent to generate a new one from the
              Family page.
            </p>
          </div>
        </div>
      );
    }
  }

  const displayName = member.nickname?.trim() || member.name;
  const familyId = member.family_id;
  const memberId = member.id;

  // Always fetch family name + all members (used across sections)
  const [{ data: familyData }, { data: allMembers }] = await Promise.all([
    supabase.from("families").select("name").eq("id", familyId).single(),
    supabase
      .from("family_members")
      .select("id, name, nickname, avatar_url, role, birth_date")
      .eq("family_id", familyId)
      .order("created_at", { ascending: true }),
  ]);

  const nestName = familyData?.name || "Our Family";
  const memberMap = Object.fromEntries(
    (allMembers || []).map((m) => [m.id, m.nickname?.trim() || m.name])
  );

  // ── Section-specific data ─────────────────────────────────────────────────

  let homeJournal: {
    id: string;
    title: string;
    content?: string;
    trip_date?: string;
    created_at: string;
    author_id: string;
  }[] = [];
  let homeEvents: {
    id: string;
    title: string;
    event_date: string;
    category: string;
  }[] = [];
  let homePhotoEntries: {
    id: string;
    title: string;
    trip_date?: string;
    journal_photos: { id: string; url: string; caption?: string }[];
  }[] = [];
  let homeCapsules: {
    id: string;
    title: string;
    content: string;
    created_at: string;
  }[] = [];

  let journalEntries: {
    id: string;
    title: string;
    content?: string;
    location?: string;
    trip_date?: string;
    created_at: string;
    author_id: string;
  }[] = [];

  let photoEntries: {
    id: string;
    title: string;
    trip_date?: string;
    journal_photos: { id: string; url: string; caption?: string }[];
  }[] = [];

  let events: {
    id: string;
    title: string;
    description?: string;
    event_date: string;
    category: string;
    recurring: string;
  }[] = [];

  let recipes: {
    id: string;
    title: string;
    story?: string;
    occasions?: string;
    ingredients?: string;
    instructions?: string;
    taught_by?: string;
    added_by?: string;
  }[] = [];

  let stories: {
    id: string;
    title: string;
    content: string;
    category: string;
    cover_url?: string;
    created_at: string;
    author_family_member_id?: string;
  }[] = [];

  let voiceMemos: {
    id: string;
    title: string;
    description?: string;
    audio_url?: string;
    duration_seconds?: number;
    recorded_date?: string;
    family_member_id?: string;
    recorded_for_id?: string;
  }[] = [];

  let timeCapsules: {
    id: string;
    title: string;
    content: string;
    unlock_date: string;
    created_at: string;
  }[] = [];

  let traditions: {
    id: string;
    title: string;
    description: string;
    when_it_happens?: string;
  }[] = [];

  let achievements: {
    id: string;
    what: string;
    achievement_date?: string;
    location?: string;
    description?: string;
    attachment_url?: string;
    family_member_id?: string;
  }[] = [];

  if (section === "home") {
    const [{ data: rj }, { data: re }, { data: rp }, { data: rc }] =
      await Promise.all([
        supabase
          .from("journal_entries")
          .select("id, title, content, trip_date, created_at, author_id")
          .eq("family_id", familyId)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("family_events")
          .select("id, title, event_date, category")
          .eq("family_id", familyId)
          .gte("event_date", new Date().toISOString().slice(0, 10))
          .order("event_date", { ascending: true })
          .limit(5),
        supabase
          .from("journal_entries")
          .select("id, title, trip_date, journal_photos(id, url, caption)")
          .eq("family_id", familyId)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("time_capsules")
          .select("id, title, content, unlock_date, created_at")
          .eq("family_id", familyId)
          .eq("to_family_member_id", memberId)
          .lte("unlock_date", new Date().toISOString().slice(0, 10))
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
    homeJournal = (rj || []) as typeof homeJournal;
    homeEvents = (re || []) as typeof homeEvents;
    homePhotoEntries = ((rp || []) as typeof homePhotoEntries).filter(
      (e) => Array.isArray(e.journal_photos) && e.journal_photos.length > 0
    );
    homeCapsules = (rc || []) as typeof homeCapsules;
  } else if (section === "journal") {
    const { data } = await supabase
      .from("journal_entries")
      .select("id, title, content, location, trip_date, created_at, author_id")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false })
      .limit(50);
    journalEntries = (data || []) as typeof journalEntries;
  } else if (section === "photos") {
    const { data } = await supabase
      .from("journal_entries")
      .select("id, title, trip_date, journal_photos(id, url, caption)")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false })
      .limit(30);
    photoEntries = ((data || []) as typeof photoEntries).filter(
      (e) => Array.isArray(e.journal_photos) && e.journal_photos.length > 0
    );
  } else if (section === "events") {
    const { data } = await supabase
      .from("family_events")
      .select("id, title, description, event_date, category, recurring")
      .eq("family_id", familyId)
      .order("event_date", { ascending: false })
      .limit(50);
    events = (data || []) as typeof events;
  } else if (section === "family") {
    // allMembers already fetched above
  } else if (section === "recipes") {
    const { data } = await supabase
      .from("recipes")
      .select(
        "id, title, story, occasions, ingredients, instructions, added_by, taught_by"
      )
      .eq("family_id", familyId)
      .order("sort_order", { ascending: true })
      .limit(50);
    recipes = (data || []) as typeof recipes;
  } else if (section === "stories") {
    const { data } = await supabase
      .from("family_stories")
      .select(
        "id, title, content, category, cover_url, created_at, author_family_member_id"
      )
      .eq("family_id", familyId)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(30);
    stories = (data || []) as typeof stories;
  } else if (section === "voice-memos") {
    const { data } = await supabase
      .from("voice_memos")
      .select(
        "id, title, description, audio_url, duration_seconds, recorded_date, family_member_id, recorded_for_id"
      )
      .eq("family_id", familyId)
      .order("recorded_date", { ascending: false })
      .limit(30);
    voiceMemos = (data || []) as typeof voiceMemos;
  } else if (section === "capsules") {
    const { data } = await supabase
      .from("time_capsules")
      .select("id, title, content, unlock_date, created_at")
      .eq("family_id", familyId)
      .eq("to_family_member_id", memberId)
      .lte("unlock_date", new Date().toISOString().slice(0, 10))
      .order("created_at", { ascending: false })
      .limit(30);
    timeCapsules = (data || []) as typeof timeCapsules;
  } else if (section === "traditions") {
    const { data } = await supabase
      .from("family_traditions")
      .select("id, title, description, when_it_happens")
      .eq("family_id", familyId)
      .order("sort_order", { ascending: true })
      .limit(50);
    traditions = (data || []) as typeof traditions;
  } else if (section === "achievements") {
    const memberIds = (allMembers || []).map((m) => m.id);
    if (memberIds.length > 0) {
      const { data } = await supabase
        .from("achievements")
        .select(
          "id, what, achievement_date, location, description, attachment_url, family_member_id"
        )
        .in("family_member_id", memberIds)
        .order("achievement_date", { ascending: false })
        .limit(50);
      achievements = (data || []) as typeof achievements;
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const baseUrl = `/kid/${token}`;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* Name row */}
          <div className="flex items-center gap-3 py-3">
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={displayName}
                loading="lazy"
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-base font-semibold text-[var(--primary)]">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate font-display text-base font-bold text-[var(--foreground)]">
                {displayName}&apos;s Family Nest
              </h1>
              <p className="truncate text-xs text-[var(--muted)]">
                {nestName} · Read-only view
              </p>
            </div>
          </div>

          {/* Tab bar */}
          <div className="relative">
            {/* Right-fade hint that more tabs exist */}
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[var(--background)] to-transparent" />
            <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SECTIONS.map((s) => (
              <Link
                key={s.key}
                href={`${baseUrl}?section=${s.key}`}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  section === s.key
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                }`}
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </Link>
            ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6">

        {/* ── HOME ──────────────────────────────────────────────────────────── */}
        {section === "home" && (
          <>
            {/* Welcome card */}
            <div className="rounded-2xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 p-5">
              <p className="text-2xl">👋</p>
              <h2 className="mt-1 font-display text-xl font-bold text-[var(--foreground)]">
                Hi, {displayName}!
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Welcome to your family&apos;s nest. Browse the tabs above to
                explore everything your family has shared.
              </p>
            </div>

            {/* Upcoming events */}
            {homeEvents.length > 0 && (
              <section>
                <SectionHeading
                  emoji="📅"
                  title="Coming Up"
                  subtitle="Upcoming family events"
                />
                <div className="space-y-2">
                  {homeEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
                    >
                      <span className="text-2xl">
                        {ev.category === "birthday"
                          ? "🎂"
                          : ev.category === "anniversary"
                          ? "💕"
                          : ev.category === "holiday"
                          ? "🎉"
                          : "📅"}
                      </span>
                      <div>
                        <p className="font-medium text-[var(--foreground)]">
                          {ev.title}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {formatDate(ev.event_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Letters for me */}
            {homeCapsules.length > 0 && (
              <section>
                <SectionHeading
                  emoji="💌"
                  title="Letters For You"
                  subtitle="Time capsules unlocked just for you"
                />
                <div className="space-y-3">
                  {homeCapsules.map((tc) => (
                    <article
                      key={tc.id}
                      className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-4"
                    >
                      <h3 className="font-semibold text-[var(--primary)]">
                        {tc.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-[var(--muted)]">
                        {tc.content}
                      </p>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        Sealed on {formatDate(tc.created_at)}
                      </p>
                    </article>
                  ))}
                  <Link
                    href={`${baseUrl}?section=capsules`}
                    className="block text-center text-sm text-[var(--primary)] hover:underline"
                  >
                    See all letters →
                  </Link>
                </div>
              </section>
            )}

            {/* Recent photos */}
            {(() => {
              const allPhotos = homePhotoEntries
                .flatMap((e) =>
                  e.journal_photos.map((p) => ({
                    ...p,
                    entryTitle: e.title,
                    tripDate: e.trip_date,
                  }))
                )
                .slice(0, 6);
              if (!allPhotos.length) return null;
              return (
                <section>
                  <SectionHeading
                    emoji="📸"
                    title="Recent Photos"
                    subtitle="Latest family memories"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {allPhotos.map((p) => (
                      <div
                        key={p.id}
                        className="aspect-square overflow-hidden rounded-lg bg-[var(--surface)]"
                      >
                        <img
                          src={p.url}
                          alt={p.caption || p.entryTitle || ""}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`${baseUrl}?section=photos`}
                    className="mt-3 block text-center text-sm text-[var(--primary)] hover:underline"
                  >
                    See all photos →
                  </Link>
                </section>
              );
            })()}

            {/* Recent journal */}
            {homeJournal.length > 0 && (
              <section>
                <SectionHeading
                  emoji="📖"
                  title="Recent Journal"
                  subtitle="Latest stories from the family"
                />
                <div className="space-y-3">
                  {homeJournal.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                    >
                      <h3 className="font-semibold text-[var(--foreground)]">
                        {entry.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {entry.trip_date
                          ? formatDate(entry.trip_date)
                          : formatDate(entry.created_at)}{" "}
                        ·{" "}
                        {entry.author_id === memberId
                          ? "You"
                          : memberMap[entry.author_id] || "Family"}
                      </p>
                      {entry.content && (
                        <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-[var(--muted)]">
                          {entry.content}
                        </p>
                      )}
                    </article>
                  ))}
                  <Link
                    href={`${baseUrl}?section=journal`}
                    className="block text-center text-sm text-[var(--primary)] hover:underline"
                  >
                    See all journal entries →
                  </Link>
                </div>
              </section>
            )}

            {/* Nothing yet */}
            {homeJournal.length === 0 &&
              homeEvents.length === 0 &&
              homePhotoEntries.length === 0 &&
              homeCapsules.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-[var(--border)] p-8 text-center">
                  <p className="text-4xl">🌱</p>
                  <p className="mt-2 text-[var(--muted)]">
                    Your family nest is just getting started! Check back soon.
                  </p>
                </div>
              )}
          </>
        )}

        {/* ── JOURNAL ───────────────────────────────────────────────────────── */}
        {section === "journal" && (
          <section>
            <SectionHeading
              emoji="📖"
              title="Family Journal"
              subtitle={`${journalEntries.length} entr${journalEntries.length === 1 ? "y" : "ies"}`}
            />
            {journalEntries.length ? (
              <div className="space-y-3">
                {journalEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-[var(--foreground)]">
                        {entry.title}
                      </h3>
                      {entry.author_id === memberId && (
                        <span className="shrink-0 rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
                          You wrote this
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {entry.trip_date
                        ? formatDate(entry.trip_date)
                        : formatDate(entry.created_at)}
                      {entry.location && ` · ${entry.location}`}
                      {" · "}
                      {entry.author_id === memberId
                        ? "You"
                        : memberMap[entry.author_id] || "Family"}
                    </p>
                    {entry.content && (
                      <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-[var(--muted)]">
                        {entry.content}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState emoji="📖" message="No journal entries yet!" />
            )}
          </section>
        )}

        {/* ── PHOTOS ────────────────────────────────────────────────────────── */}
        {section === "photos" && (
          <section>
            <SectionHeading
              emoji="📸"
              title="Family Photos"
              subtitle="Memories captured through the years"
            />
            {photoEntries.length ? (
              <div className="space-y-6">
                {photoEntries.map((entry) => (
                  <div key={entry.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-medium text-[var(--foreground)]">
                        {entry.title}
                      </h3>
                      {entry.trip_date && (
                        <span className="text-xs text-[var(--muted)]">
                          · {formatDate(entry.trip_date)}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {entry.journal_photos.map((p) => (
                        <div
                          key={p.id}
                          className="group relative overflow-hidden rounded-lg bg-[var(--surface)]"
                        >
                          <img
                            src={p.url}
                            alt={p.caption || entry.title}
                            loading="lazy"
                            className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                          />
                          {p.caption && (
                            <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1">
                              <p className="truncate text-xs text-white">
                                {p.caption}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState emoji="📸" message="No photos uploaded yet!" />
            )}
          </section>
        )}

        {/* ── EVENTS ────────────────────────────────────────────────────────── */}
        {section === "events" && (
          <section>
            <SectionHeading
              emoji="📅"
              title="Family Events"
              subtitle="Important dates and celebrations"
            />
            {events.length ? (
              <div className="space-y-2">
                {events.map((ev) => {
                  const isPast =
                    ev.event_date < new Date().toISOString().slice(0, 10);
                  return (
                    <article
                      key={ev.id}
                      className={`flex items-start gap-3 rounded-xl border p-4 ${
                        isPast
                          ? "border-[var(--border)] bg-[var(--surface)]/60 opacity-60"
                          : "border-[var(--border)] bg-[var(--surface)]"
                      }`}
                    >
                      <span className="mt-0.5 text-2xl">
                        {ev.category === "birthday"
                          ? "🎂"
                          : ev.category === "anniversary"
                          ? "💕"
                          : ev.category === "holiday"
                          ? "🎉"
                          : ev.category === "reunion"
                          ? "👨‍👩‍👧‍👦"
                          : "📅"}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-[var(--foreground)]">
                            {ev.title}
                          </h3>
                          {ev.recurring !== "none" && (
                            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--muted)]">
                              {ev.recurring === "annual"
                                ? "Every year"
                                : "Every month"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted)]">
                          {formatDate(ev.event_date)}
                          {isPast && " · Past event"}
                        </p>
                        {ev.description && (
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState emoji="📅" message="No events added yet!" />
            )}
          </section>
        )}

        {/* ── FAMILY ────────────────────────────────────────────────────────── */}
        {section === "family" && (
          <section>
            <SectionHeading
              emoji="👨‍👩‍👧"
              title={`${nestName} Family`}
              subtitle={`${(allMembers || []).length} member${(allMembers || []).length === 1 ? "" : "s"}`}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(allMembers || []).map((m) => {
                const name = m.nickname?.trim() || m.name;
                const isYou = m.id === memberId;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col items-center rounded-xl border p-4 text-center ${
                      isYou
                        ? "border-[var(--primary)]/40 bg-[var(--primary)]/5"
                        : "border-[var(--border)] bg-[var(--surface)]"
                    }`}
                  >
                    {m.avatar_url ? (
                      <img
                        src={m.avatar_url}
                        alt={name}
                        loading="lazy"
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xl font-semibold text-[var(--primary)]">
                        {name[0]?.toUpperCase()}
                      </div>
                    )}
                    <p className="mt-2 font-semibold text-[var(--foreground)]">
                      {name}
                      {isYou && (
                        <span className="ml-1 text-[var(--primary)]">★</span>
                      )}
                    </p>
                    <p className="text-xs capitalize text-[var(--muted)]">
                      {m.role}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── RECIPES ───────────────────────────────────────────────────────── */}
        {section === "recipes" && (
          <section>
            <SectionHeading
              emoji="🍽️"
              title="Family Recipes"
              subtitle="Dishes and the stories behind them"
            />
            {recipes.length ? (
              <div className="space-y-4">
                {recipes.map((r) => (
                  <article
                    key={r.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    <h3 className="font-display text-lg font-bold text-[var(--foreground)]">
                      {r.title}
                    </h3>
                    {r.occasions && (
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        🗓️ {r.occasions}
                      </p>
                    )}
                    {r.taught_by && memberMap[r.taught_by] && (
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        👩‍🍳 Taught by {memberMap[r.taught_by]}
                      </p>
                    )}
                    {r.story && (
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {r.story}
                      </p>
                    )}
                    {r.ingredients && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-[var(--foreground)]">
                          Ingredients
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted)]">
                          {r.ingredients}
                        </p>
                      </details>
                    )}
                    {r.instructions && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium text-[var(--foreground)]">
                          Instructions
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted)]">
                          {r.instructions}
                        </p>
                      </details>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState emoji="🍽️" message="No recipes added yet!" />
            )}
          </section>
        )}

        {/* ── STORIES ───────────────────────────────────────────────────────── */}
        {section === "stories" && (
          <section>
            <SectionHeading
              emoji="📚"
              title="Family Stories"
              subtitle="Memories, history, and wisdom"
            />
            {stories.length ? (
              <div className="space-y-4">
                {stories.map((s) => (
                  <article
                    key={s.id}
                    className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
                  >
                    {s.cover_url && (
                      <img
                        src={s.cover_url}
                        alt={s.title}
                        loading="lazy"
                        className="h-40 w-full object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-lg font-bold text-[var(--foreground)]">
                          {s.title}
                        </h3>
                        <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs capitalize text-[var(--muted)]">
                          {s.category.replace(/_/g, " ")}
                        </span>
                      </div>
                      {s.author_family_member_id &&
                        memberMap[s.author_family_member_id] && (
                          <p className="mt-0.5 text-xs text-[var(--muted)]">
                            By {memberMap[s.author_family_member_id]} ·{" "}
                            {formatDate(s.created_at)}
                          </p>
                        )}
                      <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted)]">
                        {s.content}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState emoji="📚" message="No stories written yet!" />
            )}
          </section>
        )}

        {/* ── VOICE MEMOS ───────────────────────────────────────────────────── */}
        {section === "voice-memos" && (
          <section>
            <SectionHeading
              emoji="🎙️"
              title="Voice Memos"
              subtitle="Recordings from the family"
            />
            {voiceMemos.length ? (
              <div className="space-y-3">
                {voiceMemos.map((memo) => {
                  const isForMe = memo.recorded_for_id === memberId;
                  const isByMe = memo.family_member_id === memberId;
                  return (
                    <article
                      key={memo.id}
                      className={`rounded-xl border p-4 ${
                        isForMe
                          ? "border-[var(--primary)]/30 bg-[var(--primary)]/5"
                          : "border-[var(--border)] bg-[var(--surface)]"
                      }`}
                    >
                      <h3 className="font-semibold text-[var(--foreground)]">
                        {memo.title}
                        {isForMe && (
                          <span className="ml-2 text-xs text-[var(--primary)]">
                            💌 For you
                          </span>
                        )}
                        {isByMe && !isForMe && (
                          <span className="ml-2 text-xs text-[var(--muted)]">
                            By you
                          </span>
                        )}
                      </h3>
                      {memo.description && (
                        <p className="mt-0.5 text-sm text-[var(--muted)]">
                          {memo.description}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {memo.recorded_date && formatDate(memo.recorded_date)}
                        {memo.family_member_id &&
                          memberMap[memo.family_member_id] && (
                            <> · By {memberMap[memo.family_member_id]}</>
                          )}
                        {memo.recorded_for_id &&
                          memberMap[memo.recorded_for_id] && (
                            <> · For {memberMap[memo.recorded_for_id]}</>
                          )}
                        {memo.duration_seconds && (
                          <>
                            {" "}
                            · {Math.floor(memo.duration_seconds / 60)}:
                            {String(memo.duration_seconds % 60).padStart(
                              2,
                              "0"
                            )}
                          </>
                        )}
                      </p>
                      {memo.audio_url && (
                        <audio
                          controls
                          preload="none"
                          className="mt-3 w-full"
                          style={{ maxHeight: "40px" }}
                        >
                          <source src={memo.audio_url} type="audio/mpeg" />
                        </audio>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState emoji="🎙️" message="No voice memos yet!" />
            )}
          </section>
        )}

        {/* ── TIME CAPSULES ─────────────────────────────────────────────────── */}
        {section === "capsules" && (
          <section>
            <SectionHeading
              emoji="💌"
              title="Letters For You"
              subtitle={`Time capsules sealed just for ${displayName}`}
            />
            {timeCapsules.length ? (
              <div className="space-y-4">
                {timeCapsules.map((tc) => (
                  <article
                    key={tc.id}
                    className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">💌</span>
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-bold text-[var(--primary)]">
                          {tc.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          Sealed {formatDate(tc.created_at)} · Unlocked{" "}
                          {formatDate(tc.unlock_date)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--foreground)]">
                      {tc.content}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                emoji="💌"
                message="No letters unlocked for you yet — they'll appear here when the time comes!"
              />
            )}
          </section>
        )}

        {/* ── TRADITIONS ────────────────────────────────────────────────────── */}
        {section === "traditions" && (
          <section>
            <SectionHeading
              emoji="✨"
              title="Family Traditions"
              subtitle="The rituals and customs that make your family unique"
            />
            {traditions.length ? (
              <div className="space-y-3">
                {traditions.map((t) => (
                  <article
                    key={t.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    <h3 className="font-semibold text-[var(--foreground)]">
                      {t.title}
                    </h3>
                    {t.when_it_happens && (
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        🗓️ {t.when_it_happens}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {t.description}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                emoji="✨"
                message="No traditions documented yet!"
              />
            )}
          </section>
        )}

        {/* ── ACHIEVEMENTS ──────────────────────────────────────────────────── */}
        {section === "achievements" && (
          <section>
            <SectionHeading
              emoji="🏆"
              title="Family Achievements"
              subtitle="Big wins and proud moments"
            />
            {achievements.length ? (
              <div className="space-y-3">
                {achievements.map((a) => {
                  const isMe = a.family_member_id === memberId;
                  return (
                    <article
                      key={a.id}
                      className={`rounded-xl border p-4 ${
                        isMe
                          ? "border-yellow-400/40 bg-yellow-50/5"
                          : "border-[var(--border)] bg-[var(--surface)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {a.attachment_url && (
                          <img
                            src={a.attachment_url}
                            alt={a.what}
                            loading="lazy"
                            className="h-14 w-14 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{isMe ? "⭐" : "🏆"}</span>
                            <h3 className="font-semibold text-[var(--foreground)]">
                              {a.what}
                            </h3>
                          </div>
                          {a.family_member_id &&
                            memberMap[a.family_member_id] && (
                              <p className="text-xs text-[var(--muted)]">
                                {memberMap[a.family_member_id]}
                                {isMe && " (you!)"}
                                {a.achievement_date &&
                                  ` · ${formatDate(a.achievement_date)}`}
                                {a.location && ` · ${a.location}`}
                              </p>
                            )}
                          {a.description && (
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              {a.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState emoji="🏆" message="No achievements recorded yet!" />
            )}
          </section>
        )}

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer className="border-t border-[var(--border)] pt-6 text-center text-sm text-[var(--muted)]">
          <p>
            Read-only view of the {nestName} family nest for {displayName}.
          </p>
          <p className="mt-1">
            <Link
              href="/login"
              className="text-[var(--primary)] hover:underline"
            >
              Sign in
            </Link>{" "}
            to access the full Family Nest.
          </p>
        </footer>
      </main>
    </div>
  );
}
