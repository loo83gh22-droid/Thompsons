"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SESSION_KEY = "fn-quick-entry-seen";
const COLLAPSED_KEY = "fn-quick-entry-collapsed";

const actions = [
  {
    href: "/dashboard/journal/new",
    label: "Write a Journal Entry",
    description: "Capture a thought or memory",
    icon: "📔",
  },
  {
    href: "/dashboard/photos",
    label: "Upload Photos",
    description: "Add photos to your family album",
    icon: "📷",
  },
  {
    href: "/dashboard/voice-memos",
    label: "Record a Voice Memo",
    description: "Preserve a voice for the future",
    icon: "🎙️",
  },
];

export function QuickEntryWidget() {
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      // Show once per browser session (reappears each new login)
      const seen = sessionStorage.getItem(SESSION_KEY);
      if (seen) return;

      // Restore collapsed preference from last session
      const wasCollapsed = localStorage.getItem(COLLAPSED_KEY) === "true";
      setCollapsed(wasCollapsed);

      // Slight delay so it doesn't pop in before the page paints
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    } catch {
      // Storage blocked — just don't show
    }
  }, []);

  function handleDismiss() {
    try {
      sessionStorage.setItem(SESSION_KEY, "true");
    } catch { /* ignore */ }
    setVisible(false);
  }

  function handleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, String(next));
    } catch { /* ignore */ }
  }

  function handleActionClick() {
    handleDismiss();
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-6 right-4 z-40 w-72 sm:right-6 transition-all duration-300 ease-out [filter:drop-shadow(0_8px_32px_rgba(99,102,241,0.40))] ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      role="complementary"
      aria-label="Quick entry shortcuts"
    >
      <div className="overflow-hidden rounded-2xl ring-1 ring-indigo-500/25 bg-[var(--surface)] shadow-2xl">
        {/* Header — gradient */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600">
          <span className="text-sm font-semibold text-white tracking-wide">
            ✨ Quick Entry
          </span>
          <div className="flex items-center gap-1">
            {/* Collapse / expand */}
            <button
              type="button"
              onClick={handleCollapse}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              aria-label={collapsed ? "Expand quick entry" : "Collapse quick entry"}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
              >
                <path d="M2 9l5-5 5 5" />
              </svg>
            </button>
            {/* Dismiss for this session */}
            <button
              type="button"
              onClick={handleDismiss}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="Dismiss quick entry"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Actions — hidden when collapsed */}
        <div
          className={`transition-all duration-200 ease-in-out overflow-hidden ${
            collapsed ? "max-h-0" : "max-h-64"
          }`}
        >
          <div className="p-2">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                onClick={handleActionClick}
                className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-lg" aria-hidden="true">
                  {action.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] leading-tight">
                    {action.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted)] leading-tight">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
