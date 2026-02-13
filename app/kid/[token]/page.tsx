import { createClient } from "@/src/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "My Family Nest — Kid View",
};

type KidMember = {
  id: string;
  name: string;
  nickname: string | null;
  avatar_url: string | null;
  family_id: string;
  kid_access_token: string;
  kid_token_expires_at: string | null;
};

export default async function KidViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Look up the member by kid access token
  const { data: member } = await supabase
    .from("family_members")
    .select("id, name, nickname, avatar_url, family_id, kid_access_token, kid_token_expires_at")
    .eq("kid_access_token", token)
    .single();

  if (!member) return notFound();

  // Check if token is expired
  if (member.kid_token_expires_at) {
    const expires = new Date(member.kid_token_expires_at);
    if (expires < new Date()) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
          <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <span className="text-5xl">🔒</span>
            <h1 className="mt-4 font-display text-2xl font-bold text-[var(--foreground)]">
              Link Expired
            </h1>
            <p className="mt-2 text-[var(--muted)]">
              This kid link has expired. Ask a parent to generate a new one from the Family page.
            </p>
          </div>
        </div>
      );
    }
  }

  const displayName = member.nickname?.trim() || member.name;
  const familyId = member.family_id;

  // Fetch content attributed to this member
  const [
    { data: journalEntries },
    { data: timeCapsules },
    { data: voiceMemos },
    { data: familyName },
  ] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id, title, content, trip_date, created_at")
      .eq("family_id", familyId)
      .eq("author_id", member.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("time_capsules")
      .select("id, title, content, unlock_date, created_at")
      .eq("family_id", familyId)
      .eq("to_family_member_id", member.id)
      .lte("unlock_date", new Date().toISOString().slice(0, 10))
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("voice_memos")
      .select("id, title, description, audio_url, duration_seconds, recorded_date")
      .eq("family_id", familyId)
      .or(`family_member_id.eq.${member.id},recorded_for_id.eq.${member.id}`)
      .order("recorded_date", { ascending: false })
      .limit(10),
    supabase
      .from("families")
      .select("name")
      .eq("id", familyId)
      .single(),
  ]);

  const nestName = familyName?.name || "Our Family";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={displayName}
              loading="lazy"
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/30 text-lg font-semibold text-purple-400">
              {displayName[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-lg font-bold text-[var(--foreground)]">
              {displayName}&apos;s Corner
            </h1>
            <p className="text-xs text-[var(--muted)]">{nestName} Nest</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
        {/* Journal entries about this member */}
        <section>
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
            Your Journal Entries
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Stories and memories written about you
          </p>
          {journalEntries?.length ? (
            <div className="mt-4 space-y-3">
              {journalEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {entry.title}
                  </h3>
                  {entry.trip_date && (
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {new Date(entry.trip_date + "T12:00:00").toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {entry.content && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted)] line-clamp-4">
                      {entry.content}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-6 text-center">
              <p className="text-[var(--muted)]">No journal entries yet!</p>
            </div>
          )}
        </section>

        {/* Unlocked time capsules */}
        {timeCapsules && timeCapsules.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
              💌 Letters For You
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Time capsules that have been unlocked
            </p>
            <div className="mt-4 space-y-3">
              {timeCapsules.map((tc) => (
                <article
                  key={tc.id}
                  className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4"
                >
                  <h3 className="font-semibold text-purple-400">
                    {tc.title}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted)]">
                    {tc.content}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Sealed on{" "}
                    {new Date(tc.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Voice memos */}
        {voiceMemos && voiceMemos.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
              🎙️ Voice Memos
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Recordings by or for you
            </p>
            <div className="mt-4 space-y-3">
              {voiceMemos.map((memo) => (
                <article
                  key={memo.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {memo.title}
                  </h3>
                  {memo.description && (
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {memo.description}
                    </p>
                  )}
                  {memo.audio_url && (
                    <audio
                      controls
                      preload="none"
                      className="mt-2 w-full"
                      style={{ maxHeight: "40px" }}
                    >
                      <source src={memo.audio_url} type="audio/mpeg" />
                    </audio>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-[var(--border)] pt-6 text-center text-sm text-[var(--muted)]">
          <p>This is a read-only view of {displayName}&apos;s family content.</p>
          <p className="mt-1">
            <Link href="/login" className="text-[var(--accent)] hover:underline">
              Sign in
            </Link>{" "}
            to access the full Family Nest.
          </p>
        </footer>
      </main>
    </div>
  );
}
