"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function GiftWelcomeBanner() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  function dismiss() {
    setDismissed(true);
    router.replace("/dashboard");
  }

  if (dismissed) return null;

  return (
    <section
      className="rounded-2xl border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/8 to-[var(--surface)] p-5 relative"
      aria-label="Welcome to your Family Nest"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss welcome message"
        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
      >
        ×
      </button>

      <div className="flex items-start gap-3">
        <span className="text-3xl" aria-hidden="true">🎁</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
            Your Family Nest is ready.
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            This is your private space — just for the people you come home to. Start by adding your family, then capture your first memory.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dashboard/members"
              onClick={dismiss}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              Add family members →
            </Link>
            <Link
              href="/dashboard/journal/new"
              onClick={dismiss}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Write your first memory
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
