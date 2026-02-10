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
        <ul className="mt-6 space-y-4" aria-label="Quick start tips">
          <li className="flex items-start gap-3">
            <span className="text-2xl shrink-0" role="img" aria-hidden>📷</span>
            <span className="text-[var(--foreground)]">Upload your first photo or memory</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-2xl shrink-0" role="img" aria-hidden>🎙️</span>
            <span className="text-[var(--foreground)]">Record a voice memo to preserve voices</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-2xl shrink-0" role="img" aria-hidden>👥</span>
            <span className="text-[var(--foreground)]">Invite family members to collaborate</span>
          </li>
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-[44px] w-full rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--background)] transition-colors hover:bg-[var(--accent-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:w-auto"
          >
            Get Started
          </button>
          <span className="flex items-center justify-center text-sm text-[var(--muted)] sm:justify-end">
            <span className="sr-only">Optional: </span>
            <Link href="/dashboard/timeline" onClick={handleDismiss} className="text-[var(--accent)] hover:underline">
              Take a quick tour
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
