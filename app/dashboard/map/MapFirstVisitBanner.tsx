"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getMapPinCount } from "./actions";

const STORAGE_KEY = "map-first-visit-banner-dismissed";

export function MapFirstVisitBanner() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) {
      setLoading(false);
      return;
    }
    getMapPinCount().then((count) => {
      setShow(count === 0);
      setLoading(false);
    });
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }

  if (loading || !show) return null;

  return (
    <div
      role="region"
      aria-label="First-time map tips"
      className="mb-4 flex items-start justify-between gap-4 rounded-xl border-2 border-dashed border-[var(--accent)]/40 bg-[var(--accent)]/5 px-4 py-4 sm:px-6"
    >
      <div>
        <p className="font-display text-lg font-semibold text-[var(--foreground)]">
          Add your first pin or sync birth places from Our Family
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Add a location in a journal entry or use the form below. You can also sync birth places from your family members.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/dashboard/journal/new"
            className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            Add journal entry with location
          </Link>
          <Link
            href="/dashboard/our-family"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)]"
          >
            Our Family
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
