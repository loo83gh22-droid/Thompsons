"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function EventsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Events Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-900/20 text-2xl">
          <span aria-hidden="true">📅</span>
        </div>

        <h1 className="font-display text-xl font-bold text-[var(--foreground)]">
          Events couldn&apos;t load
        </h1>

        <p className="mt-2 text-sm text-[var(--muted)]">
          There was a problem loading the events page. This might be a temporary
          issue — try again or check back later.
        </p>

        {error.digest && (
          <p className="mt-2 text-xs text-[var(--muted)]/60">
            Error ID: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--accent)]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
