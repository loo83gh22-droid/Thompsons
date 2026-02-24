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
    console.error("[Root Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {error.message.includes("Supabase")
            ? "Configuration error. Check env vars in Vercel project settings."
            : "Try again or go back home."}
        </p>
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-[var(--accent)] px-6 py-2 font-medium text-[var(--background)] hover:bg-[var(--accent-muted)] min-h-[44px]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-[var(--border)] px-6 py-2 font-medium hover:bg-[var(--surface)] min-h-[44px] flex items-center"
          >
            Home
          </Link>
          <a
            href="/contact?category=Bug+Report"
            className="rounded-lg border border-[var(--border)] px-6 py-2 font-medium hover:bg-[var(--surface)] min-h-[44px] flex items-center"
          >
            Report issue
          </a>
        </div>
      </div>
    </div>
  );
}
