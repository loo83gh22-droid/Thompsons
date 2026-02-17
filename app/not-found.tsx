import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-6xl font-bold text-[var(--accent)]">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-[var(--foreground)]">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-[var(--accent)] px-6 py-2 font-medium text-[var(--background)] hover:bg-[var(--accent-muted)] min-h-[44px] flex items-center"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-[var(--border)] px-6 py-2 font-medium hover:bg-[var(--surface)] min-h-[44px] flex items-center"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
