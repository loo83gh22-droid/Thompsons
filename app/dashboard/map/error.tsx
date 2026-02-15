"use client";

import { useEffect } from "react";

export default function MapError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Family Map error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border)] p-8 text-center max-w-md mx-auto">
      <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
        Map couldn&apos;t load
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        This often happens when the Google Maps API key is missing, invalid, or blocked.
        Check that <code className="rounded bg-[var(--surface-hover)] px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> is
        set in your environment, then try again.
      </p>
      <div className="mt-6 flex gap-3 justify-center">
        <button
          onClick={reset}
          className="rounded-full bg-[var(--primary)] px-5 py-2 font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
