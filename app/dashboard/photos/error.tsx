"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Module Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-lg font-semibold text-[var(--foreground)]">Something went wrong</p>
      <p className="mt-2 text-sm text-[var(--muted)]">We hit an unexpected error loading this section.</p>
      {error.digest && (
        <p className="mt-1 text-xs text-[var(--muted)]/60">Error ID: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-[var(--border)] px-5 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)]"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
