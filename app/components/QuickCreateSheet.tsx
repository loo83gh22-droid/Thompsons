"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

type CreateItem = {
  href: string;
  label: string;
  icon: string;
  color: string; // tailwind bg class for icon bg
};

const captureItems: CreateItem[] = [
  { href: "/dashboard/journal/new", label: "Journal", icon: "📔", color: "bg-indigo-100 dark:bg-indigo-900/50" },
  { href: "/dashboard/photos", label: "Photos", icon: "📷", color: "bg-sky-100 dark:bg-sky-900/50" },
  { href: "/dashboard/voice-memos", label: "Voice", icon: "🎙️", color: "bg-violet-100 dark:bg-violet-900/50" },
];

const rememberItems: CreateItem[] = [
  { href: "/dashboard/recipes", label: "Recipe", icon: "🍽️", color: "bg-amber-100 dark:bg-amber-900/50" },
  { href: "/dashboard/events", label: "Event", icon: "📅", color: "bg-green-100 dark:bg-green-900/50" },
  { href: "/dashboard/traditions", label: "Tradition", icon: "✨", color: "bg-pink-100 dark:bg-pink-900/50" },
  { href: "/dashboard/pets", label: "Pet", icon: "🐾", color: "bg-orange-100 dark:bg-orange-900/50" },
];

const preserveItems: CreateItem[] = [
  { href: "/dashboard/stories/new", label: "Story", icon: "📖", color: "bg-teal-100 dark:bg-teal-900/50" },
  { href: "/dashboard/time-capsules", label: "Time Capsule", icon: "⏰", color: "bg-rose-100 dark:bg-rose-900/50" },
  { href: "/dashboard/trophy-case", label: "Achievement", icon: "🏆", color: "bg-yellow-100 dark:bg-yellow-900/50" },
  { href: "/dashboard/favourites", label: "Favourite", icon: "❤️", color: "bg-red-100 dark:bg-red-900/50" },
];

function ItemGrid({ items, onClose }: { items: CreateItem[]; onClose: () => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className="flex flex-col items-center gap-1.5 rounded-xl p-2 transition-colors active:bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${item.color}`} aria-hidden="true">
            {item.icon}
          </span>
          <span className="text-center text-xs font-medium text-[var(--foreground)] leading-tight">
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function QuickCreateSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[55] bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Quick create"
        className={`fixed bottom-0 left-0 right-0 z-[60] rounded-t-3xl border-t border-[var(--border)] bg-[var(--background)] shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
            What would you like to add?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5 space-y-5">
          {/* Capture section */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Capture a moment
            </p>
            <ItemGrid items={captureItems} onClose={onClose} />
          </div>

          {/* Remember section */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Remember &amp; record
            </p>
            <ItemGrid items={rememberItems} onClose={onClose} />
          </div>

          {/* Preserve section */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Preserve forever
            </p>
            <ItemGrid items={preserveItems} onClose={onClose} />
          </div>
        </div>
      </div>
    </>
  );
}
