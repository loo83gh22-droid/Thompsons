"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasRecentFeedback } from "@/app/dashboard/feedback/actions";

const SESSION_COUNT_KEY = "family-nest-session-count";
const FEEDBACK_DISMISS_KEY = "family-nest-feedback-dismissed";
const SESSIONS_BEFORE_PROMPT = 7;
const DISMISS_DAYS = 30;
const MAX_DISMISSALS = 3;

export function FeedbackPromptModal() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkShouldShow() {
      try {
        // Increment session count
        const count = parseInt(localStorage.getItem(SESSION_COUNT_KEY) || "0", 10) + 1;
        localStorage.setItem(SESSION_COUNT_KEY, String(count));

        // Not enough sessions yet
        if (count < SESSIONS_BEFORE_PROMPT) return;

        // Check dismissal state
        const dismissRaw = localStorage.getItem(FEEDBACK_DISMISS_KEY);
        if (dismissRaw) {
          const dismiss = JSON.parse(dismissRaw) as { dismissedAt: string; count: number };

          // Permanently dismissed after MAX_DISMISSALS
          if (dismiss.count >= MAX_DISMISSALS) return;

          // Still within cooldown period
          const dismissedAt = new Date(dismiss.dismissedAt);
          const daysSince = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince < DISMISS_DAYS) return;
        }

        // Check if user submitted feedback recently (server-side)
        const recentFeedback = await hasRecentFeedback();
        if (recentFeedback) return;

        if (!cancelled) setShow(true);
      } catch {
        // localStorage or server errors - silently skip
      }
    }

    // Delay the check so it doesn't interfere with page load
    const timer = setTimeout(checkShouldShow, 3000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  function handleDismiss() {
    try {
      const dismissRaw = localStorage.getItem(FEEDBACK_DISMISS_KEY);
      const prev = dismissRaw ? JSON.parse(dismissRaw) as { count: number } : { count: 0 };
      localStorage.setItem(FEEDBACK_DISMISS_KEY, JSON.stringify({
        dismissedAt: new Date().toISOString(),
        count: prev.count + 1,
      }));
    } catch { /* ignore */ }
    setShow(false);
  }

  function handleGoToFeedback() {
    setShow(false);
    router.push("/dashboard/feedback");
  }

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-prompt-title"
      >
        <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl text-center">
          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="text-4xl mb-3" aria-hidden="true">{"\u{1F4AC}"}</div>
          <h2 id="feedback-prompt-title" className="font-display text-xl font-semibold text-[var(--foreground)]">
            How&apos;s everything going?
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            We&apos;d love to hear what you think about Family Nest. Your feedback helps us make it better for everyone.
          </p>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleGoToFeedback}
              className="rounded-full bg-[var(--accent)] px-4 py-3 font-medium text-white hover:brightness-110 min-h-[44px]"
            >
              Share Feedback
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full border border-[var(--border)] px-4 py-3 font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] min-h-[44px]"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
