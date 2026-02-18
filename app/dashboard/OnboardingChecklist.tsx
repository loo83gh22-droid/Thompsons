"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Confetti from "react-confetti";

type OnboardingStep = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  done: boolean;
};

const ARCHIVED_KEY = "family-nest-onboarding-archived";
const HIDDEN_KEY = "family-nest-onboarding-hidden";
const CELEBRATED_KEY = "family-nest-onboarding-celebrated";

export function OnboardingChecklist({
  memberCount,
  photoCount,
  journalCount,
  storyCount,
  voiceMemoCount,
}: {
  memberCount: number;
  photoCount: number;
  journalCount: number;
  storyCount: number;
  voiceMemoCount: number;
}) {
  const [archived, setArchived] = useState(true); // hidden by default until checked
  const [sessionHidden, setSessionHidden] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    try {
      // Migrate old dismissed key to new archived key
      const oldDismissed = localStorage.getItem("family-nest-onboarding-dismissed");
      if (oldDismissed === "true") {
        localStorage.setItem(ARCHIVED_KEY, "true");
        localStorage.removeItem("family-nest-onboarding-dismissed");
      }

      const isArchived = localStorage.getItem(ARCHIVED_KEY) === "true";
      const isHidden = sessionStorage.getItem(HIDDEN_KEY) === "true";
      setArchived(isArchived);
      setSessionHidden(isHidden);
    } catch {
      setArchived(false);
      setSessionHidden(false);
    }
  }, []);

  // Track window size for confetti
  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const steps: OnboardingStep[] = [
    {
      id: "members",
      label: "Add your first family member",
      description: "Start your family tree. Add a spouse, child, or parent.",
      href: "/dashboard/our-family",
      icon: "👨‍👩‍👧‍👦",
      done: memberCount >= 2, // They're already 1 (themselves), so 2+ means they added someone
    },
    {
      id: "photo",
      label: "Upload a photo",
      description: "Add a family photo to your mosaic background.",
      href: "/dashboard/photos",
      icon: "📷",
      done: photoCount >= 1,
    },
    {
      id: "journal",
      label: "Write a journal entry",
      description: "Capture a memory, trip, or milestone.",
      href: "/dashboard/journal/new",
      icon: "📔",
      done: journalCount >= 1,
    },
    {
      id: "story",
      label: "Share a family story",
      description: "Write about how your parents met, a family tradition, or a lesson learned.",
      href: "/dashboard/stories/new",
      icon: "📖",
      done: storyCount >= 1,
    },
    {
      id: "voice",
      label: "Record a voice memo",
      description: "Preserve a voice for the future. Tell a story, sing a lullaby.",
      href: "/dashboard/voice-memos",
      icon: "🎙️",
      done: voiceMemoCount >= 1,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  // Auto-archive and celebrate when all steps are complete
  useEffect(() => {
    if (allDone) {
      try {
        const alreadyCelebrated = localStorage.getItem(CELEBRATED_KEY) === "true";
        if (!alreadyCelebrated) {
          setShowConfetti(true);
          localStorage.setItem(CELEBRATED_KEY, "true");
          // Auto-hide confetti after 5 seconds
          setTimeout(() => setShowConfetti(false), 5000);
        }
        localStorage.setItem(ARCHIVED_KEY, "true");
      } catch { /* ignore */ }
    }
  }, [allDone]);

  // Don't show if archived, session-hidden, or all done
  if (archived || sessionHidden || allDone) return null;

  const progressPercent = Math.round((completedCount / steps.length) * 100);

  function handleHide() {
    setSessionHidden(true);
    try {
      sessionStorage.setItem(HIDDEN_KEY, "true");
    } catch {
      // ignore
    }
  }

  function handleArchive() {
    setArchived(true);
    try {
      localStorage.setItem(ARCHIVED_KEY, "true");
    } catch {
      // ignore
    }
  }

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={200}
          recycle={false}
          gravity={0.3}
        />
      )}
      <section className="rounded-xl border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/5 to-[var(--surface)] p-5 sm:p-6">
        {allDone && (
          <div className="mb-4 rounded-lg border-2 border-emerald-500 bg-emerald-50 p-4 text-center">
            <div className="mb-2 text-4xl">🎉</div>
            <h3 className="font-display text-lg font-bold text-emerald-700">
              Congratulations!
            </h3>
            <p className="mt-1 text-sm text-emerald-600">
              You&apos;ve completed all onboarding steps. Your Family Nest is ready to grow!
            </p>
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--foreground)]">
            Get Started
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Complete these steps to bring Your Family Nest to life.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleHide}
            className="shrink-0 rounded-lg px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            aria-label="Hide checklist for this session"
          >
            Hide
          </button>
          <button
            type="button"
            onClick={handleArchive}
            className="shrink-0 rounded-lg border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            aria-label="Permanently dismiss checklist"
          >
            Don&apos;t show again
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-xs text-[var(--muted)]">
          <span>{completedCount} of {steps.length} complete</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
            style={{ width: `${Math.max(progressPercent, 2)}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <ul className="mt-5 space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                step.done
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)]"
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base" aria-hidden>
                {step.done ? "✓" : step.icon}
              </span>
              <div className="min-w-0 flex-1">
                <span className={`font-medium ${step.done ? "line-through opacity-70" : ""}`}>
                  {step.label}
                </span>
                {!step.done && (
                  <p className="mt-0.5 text-xs text-[var(--muted)] truncate">{step.description}</p>
                )}
              </div>
              {!step.done && (
                <span className="shrink-0 text-xs font-medium text-[var(--accent)]">Start &rarr;</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      </section>
    </>
  );
}
