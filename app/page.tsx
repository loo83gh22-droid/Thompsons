import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-5xl font-bold tracking-tight text-[var(--foreground)] sm:text-7xl md:text-8xl">
            My Family Nest
          </h1>
          <p className="mt-2 font-display text-2xl italic text-[var(--accent)] sm:text-3xl">
            Your corner of the world
          </p>

          <p className="mt-8 text-lg text-[var(--muted)]">
            A private space for your family — travels, memories, lessons, and the
            stories that bind you together.
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

          <div className="mt-14 flex flex-wrap justify-center gap-3 sm:gap-4">
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-2 text-sm text-[var(--muted)] backdrop-blur">
              🗺️ Map & Journal
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-2 text-sm text-[var(--muted)] backdrop-blur">
              ⭐ Favourites
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-2 text-sm text-[var(--muted)] backdrop-blur">
              💌 Messages
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-2 text-sm text-[var(--muted)] backdrop-blur">
              🇪🇸 Spanish
            </span>
          </div>
        </div>

        <footer className="absolute bottom-8 text-sm text-[var(--muted)]">
          Private · Family only
        </footer>
      </main>
    </div>
  );
}
