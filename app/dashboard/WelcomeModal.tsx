"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "family-nest-welcome-dismissed";

export function WelcomeModal({ familyName }: { familyName: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  function handleDismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  if (!open) return null;

  const displayName = familyName?.trim() || "Your Family";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden
        onClick={handleDismiss}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8">
        <h1 id="welcome-title" className="font-display text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
          Welcome to {displayName}&apos;s Family Nest!
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          A private space to preserve and share your family&apos;s story.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Here&apos;s how to make it yours in under 5 minutes:
        </p>
        <ol className="mt-4 space-y-3" aria-label="Quick start steps">
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-sm font-bold text-[var(--accent)]">1</span>
            <div>
              <span className="font-medium text-[var(--foreground)]">Add your family members</span>
              <p className="text-sm text-[var(--muted)]">Start with the people closest to you.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-sm font-bold text-[var(--accent)]">2</span>
            <div>
              <span className="font-medium text-[var(--foreground)]">Upload a photo</span>
              <p className="text-sm text-[var(--muted)]">It becomes part of your family mosaic background.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-sm font-bold text-[var(--accent)]">3</span>
            <div>
              <span className="font-medium text-[var(--foreground)]">Write your first memory</span>
              <p className="text-sm text-[var(--muted)]">A journal entry, story, or recipe to get started.</p>
            </div>
          </li>
        </ol>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/our-family"
            onClick={handleDismiss}
            className="min-h-[44px] w-full rounded-full bg-[var(--primary)] px-6 py-3 text-center font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] sm:w-auto"
          >
            Add Family Members
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-[44px] w-full rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] sm:w-auto"
          >
            I&apos;ll explore on my own
          </button>
        </div>
      </div>
    </div>
  );
}
