// Share pages use the admin (service-role) client — token validation is enforced in app code via share_token + is_public filters.
import { createAdminClient } from "@/src/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { AudioPlayer } from "./AudioPlayer";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const supabase = createAdminClient();
  const { data: memo } = await supabase
    .from("voice_memos")
    .select("title, description")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (!memo) return { title: "Voice Memo Not Found" };

  const description = memo.description?.slice(0, 160) || "A voice memo shared from Family Nest.";
  const pageUrl = `https://familynest.io/share/memo/${token}`;

  return {
    title: `${memo.title} | Family Nest`,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: memo.title,
      description,
      url: pageUrl,
      siteName: "Family Nest",
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `${memo.title} | Family Nest`,
      description,
    },
  };
}

export default async function PublicMemoPage({ params }: Props) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: memo } = await supabase
    .from("voice_memos")
    .select("id, title, description, audio_url, photo_url, duration_seconds, recorded_date, created_at, family_member_id, family_id")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (!memo) return notFound();

  // Fetch recorder name
  let recorderName: string | null = null;
  if (memo.family_member_id) {
    const { data: member } = await supabase
      .from("family_members")
      .select("name, nickname")
      .eq("id", memo.family_member_id)
      .single();
    if (member) recorderName = member.nickname?.trim() || member.name;
  }

  // Fetch family name
  const { data: family } = await supabase
    .from("families")
    .select("name")
    .eq("id", memo.family_id)
    .single();

  const familyName = family?.name || "A Family";

  const dateStr = memo.recorded_date
    ? new Date(memo.recorded_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : new Date(memo.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // audio_url is stored as a direct URL (used directly in <audio src> in VoiceMemoList)
  const audioSrc = memo.audio_url;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-display text-lg font-semibold text-[var(--primary)]">
            Family Nest
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            Start Your Family Nest
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {/* Accent top strip */}
          <div className="h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]/40" />

          <div className="flex flex-col sm:flex-row">
            {/* Photo or mic icon */}
            {memo.photo_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={memo.photo_url}
                alt=""
                className="h-48 w-full object-cover sm:h-auto sm:w-40 sm:shrink-0"
                loading="lazy"
              />
            )}

            <div className="flex-1 p-6 sm:p-8">
              <p className="text-sm font-medium text-[var(--accent)]">
                From the {familyName} Family
              </p>
              <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-[var(--foreground)] sm:text-3xl">
                {memo.title}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                {recorderName && <span>Recorded by {recorderName}</span>}
                {recorderName && <span>&middot;</span>}
                <span>{dateStr}</span>
              </div>

              {memo.description && (
                <p className="mt-4 leading-relaxed text-[var(--foreground)]/80">
                  {memo.description}
                </p>
              )}

              <div className="mt-6">
                <AudioPlayer src={audioSrc} />
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center sm:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
            Voices are the most fleeting thing we have.
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            Family Nest is a private space to preserve the voices, stories, and memories that matter most.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-full bg-[var(--primary)] px-8 py-3 font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            Start Your Family Nest (Free)
          </Link>
        </div>
      </main>
    </div>
  );
}
