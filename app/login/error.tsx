"use client";

import Link from "next/link";

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {error.message.includes("Supabase")
            ? "Configuration error. Check that env vars are set in Vercel."
            : "Try again or go back to the home page."}
        </p>
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-[var(--accent)] px-6 py-2 font-medium text-[var(--background)] hover:bg-[var(--accent-muted)]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-[var(--border)] px-6 py-2 font-medium hover:bg-[var(--surface)]"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
