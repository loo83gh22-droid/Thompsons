import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import Image from "next/image";
import { formatDateOnly } from "@/src/lib/date";

export default async function JournalPage() {
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select(`
      id,
      title,
      content,
      location,
      trip_date,
      created_at,
      family_members (name)
    `)
    .order("trip_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Journal
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Stories and photos from trips, birthdays, and celebrations. Chronological by date.
          </p>
        </div>
        <Link
          href="/dashboard/journal/new"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--background)] transition-colors hover:bg-[var(--accent-muted)]"
        >
          New entry
        </Link>
      </div>

      <div className="mt-12 space-y-8">
        {!entries?.length ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <p className="text-[var(--muted)]">
              No journal entries yet. Create your first one to get started.
            </p>
          </div>
        ) : (
          entries.map(async (entry) => {
            const { data: photos } = await supabase
              .from("journal_photos")
              .select("id, url, caption")
              .eq("entry_id", entry.id)
              .order("sort_order");

            const date = entry.trip_date
              ? formatDateOnly(entry.trip_date)
              : new Date(entry.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

            return (
              <article
                key={entry.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-2 text-sm text-[var(--muted)]">
                    <time dateTime={entry.trip_date || entry.created_at}>
                      {date}
                    </time>
                    {entry.location && (
                      <>
                        <span>·</span>
                        <span>{entry.location}</span>
                      </>
                    )}
                    {(() => {
                      const raw = entry.family_members as unknown;
                      const author = Array.isArray(raw) ? raw[0] : raw;
                      const name = author?.name;
                      return name ? (
                        <>
                          <span>·</span>
                          <span>{name}</span>
                        </>
                      ) : null;
                    })()}
                  </div>
                  <h2 className="mt-2 font-display text-xl font-semibold text-[var(--foreground)]">
                    {entry.title}
                  </h2>
                  {entry.content && (
                    <div className="mt-4 whitespace-pre-wrap text-[var(--foreground)]/90">
                      {entry.content}
                    </div>
                  )}
                    </div>
                    <Link
                      href={`/dashboard/journal/${entry.id}/edit`}
                      className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-hover)]"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
                {photos && photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto p-4 pt-0">
                    {photos.map((photo, i) => (
                      <div
                        key={photo.id ?? i}
                        className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-lg"
                      >
                        <Image
                          src={photo.url}
                          alt={photo.caption || `Photo ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="192px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
