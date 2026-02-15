"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console in development for debugging
    console.error("[Dashboard Error]", error);
  }, [error]);

  const isConfigError =
    error.message.includes("Supabase") ||
    error.message.includes("env") ||
    error.message.includes("NEXT_PUBLIC");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-900/20 text-3xl">
          <span aria-hidden="true">⚠️</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">
          Something went wrong
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          {isConfigError
            ? "There's a configuration issue. Please contact support or check the project settings."
            : "We hit an unexpected error. You can try again, or head back to the dashboard."}
        </p>

        {/* Error digest for support */}
        {error.digest && (
          <p className="mt-2 text-xs text-[var(--muted)]/60">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Feedback link */}
        <p className="mt-6 text-xs text-[var(--muted)]">
          If this keeps happening,{" "}
          <a
            href={`mailto:${typeof process.env.NEXT_PUBLIC_FEEDBACK_EMAIL === "string" ? process.env.NEXT_PUBLIC_FEEDBACK_EMAIL : "feedback@example.com"}?subject=Family%20Nest%20Error%20Report&body=Error%20ID:%20${error.digest ?? "unknown"}%0A%0AWhat%20I%20was%20doing:%20`}
            className="text-[var(--accent)] hover:underline"
          >
            let us know
          </a>
          .
        </p>
      </div>
    </div>
  );
}
