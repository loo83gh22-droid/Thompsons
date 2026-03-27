"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "family-nest-founder-note-dismissed";
const REMIND_KEY = "family-nest-founder-note-remind-at";

export function FounderNoteModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      // Permanently dismissed?
      if (localStorage.getItem(DISMISSED_KEY) === "true") return;

      // Remind later?
      const remindAt = localStorage.getItem(REMIND_KEY);
      if (remindAt && Date.now() < parseInt(remindAt, 10)) return;

      // Show after 1.5s so it doesn't compete with the welcome tour
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, "true"); } catch { /* ignore */ }
    setOpen(false);
  }

  function remindLater() {
    try {
      const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem(REMIND_KEY, sevenDays.toString());
    } catch { /* ignore */ }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden onClick={remindLater} />

      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-2xl">
        {/* Close */}
        <button
          onClick={remindLater}
          className="absolute right-4 top-4 rounded-full p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10 text-xl">
            👋
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">A note from Rob</p>
            <p className="text-sm font-medium text-[var(--foreground)]">Founder, Family Nest</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-[var(--foreground)] leading-relaxed">
          <p>
            Hey — I just wanted to say thank you, genuinely, for signing up.
          </p>
          <p>
            Family Nest started because I wanted a better way to hold onto the stuff that matters. Not social media, not just a photo album. Something that actually captures <em>your</em> family&apos;s story — the funny quotes, the recipes, the seasons, the people.
          </p>
          <p>
            I&apos;d love to know what brought you here. One honest reply helps me build something that&apos;s actually useful. What made you sign up?
          </p>
          <p className="text-[var(--muted)]">
            If you have features you&apos;d love to see, I&apos;m all ears for that too.
          </p>
          <p className="font-medium">
            Rob
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <a
            href="mailto:rob@familynest.io?subject=Why I signed up for Family Nest&body=Hey Rob,"
            onClick={dismiss}
            className="flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Email Rob a note ✉️
          </a>
          <div className="flex gap-2">
            <button
              onClick={remindLater}
              className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)]"
            >
              Remind me later
            </button>
            <button
              onClick={dismiss}
              className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)]"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
