"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface ChangelogEntry {
  id: string;
  date: string;
  title: string;
  items: string[];
}

const STORAGE_KEY = "fn-whats-new-dismissed";

export function WhatsNewBanner() {
  const [entry, setEntry] = useState<ChangelogEntry | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    fetch("/changelog.json")
      .then((r) => r.json())
      .then((entries: ChangelogEntry[]) => {
        if (!entries?.length) return;
        const latest = entries[0];
        const dismissedId = localStorage.getItem(STORAGE_KEY);
        if (dismissedId !== latest.id) {
          setEntry(latest);
          setDismissed(false);
        }
      })
      .catch(() => {
        // Silently fail — banner is non-critical
      });
  }, []);

  function dismiss() {
    if (entry) localStorage.setItem(STORAGE_KEY, entry.id);
    setDismissed(true);
  }

  if (dismissed || !entry) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-2 mb-1">
      <div className="relative rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 to-slate-900/60 px-4 py-3 shadow-sm">
        {/* Dismiss button */}
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>

        {/* Header row */}
        <div className="flex items-center gap-2 pr-6">
          <Sparkles size={14} className="shrink-0 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">
            What&apos;s New
          </span>
          <span className="text-xs text-slate-500">&mdash; {entry.date}</span>
          <span className="ml-1 text-sm font-medium text-slate-200">{entry.title}</span>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors shrink-0"
          >
            {expanded ? (
              <>Hide <ChevronUp size={13} /></>
            ) : (
              <>Show all <ChevronDown size={13} /></>
            )}
          </button>
        </div>

        {/* Expandable feature list */}
        {expanded && (
          <ul className="mt-3 grid gap-1 sm:grid-cols-2 pr-4">
            {entry.items.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-xs text-slate-300"
              >
                <span className="mt-0.5 shrink-0 text-amber-400">✓</span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
