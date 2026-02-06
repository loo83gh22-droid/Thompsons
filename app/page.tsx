import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-5xl font-bold tracking-tight text-[var(--foreground)] sm:text-7xl md:text-8xl">
            My Family Nest
          </h1>
          <p className="mt-2 font-display text-2xl italic text-[var(--accent)] sm:text-3xl">
            Your corner of the world
          </p>

          <p className="mt-8 text-lg text-[var(--muted)]">
            <strong className="text-[var(--foreground)]">100% private.</strong> No ads, no tracking, no strangers.
            Just your family — travels, memories, favourites, and the stories that bind you together.
          </p>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-8 py-4 font-semibold text-[var(--background)] transition-all hover:bg-[var(--accent-muted)] hover:scale-[1.02]"
            >
              Sign up my Family
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-8 py-4 font-medium text-[var(--foreground)] hover:bg-[var(--surface)]"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-6 text-sm text-[var(--muted)]">
            Free to start. Add your family, share memories, and stay connected.
          </p>

          {/* Map preview */}
          <div className="mt-14 w-full max-w-2xl">
            <p className="mb-4 text-sm font-medium text-[var(--muted)]">What&apos;s inside</p>
            <div className="rounded-xl border-2 border-[var(--border)] bg-[var(--surface)]/80 p-6 backdrop-blur">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-[var(--background)]">
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-[var(--surface)] to-[var(--background)]">
                  <div className="text-center">
                    <span className="text-5xl">🗺️</span>
                    <p className="mt-2 font-display text-lg font-semibold text-[var(--foreground)]">
                      Family travel map
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Pin where you&apos;ve been. See where the family has explored together.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="rounded-full border border-[var(--border)] bg-[var(--background)]/60 px-3 py-1 text-xs text-[var(--muted)]">
                  📔 Journal
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--background)]/60 px-3 py-1 text-xs text-[var(--muted)]">
                  ⭐ Favourites
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--background)]/60 px-3 py-1 text-xs text-[var(--muted)]">
                  💌 Messages
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--background)]/60 px-3 py-1 text-xs text-[var(--muted)]">
                  🌳 Family tree
                </span>
              </div>
            </div>
          </div>
        </div>

        <footer className="absolute bottom-8 text-sm text-[var(--muted)]">
          Private · Family only · No ads
        </footer>
      </main>
    </div>
  );
}
