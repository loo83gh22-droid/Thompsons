"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type OnboardingStep = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  done: boolean;
};

const DISMISSED_KEY = "family-nest-onboarding-dismissed";

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
  const [dismissed, setDismissed] = useState(true); // hidden by default until checked

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DISMISSED_KEY);
      setDismissed(saved === "true");
    } catch {
      setDismissed(false);
    }
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

  // Don't show if dismissed or all done
  if (dismissed || allDone) return null;

  const progressPercent = Math.round((completedCount / steps.length) * 100);

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // ignore
    }
  }

  return (
    <section className="rounded-xl border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/5 to-[var(--surface)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--foreground)]">
            Get Started
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Complete these steps to bring your Family Nest to life.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-lg px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          aria-label="Dismiss checklist"
        >
          Hide
        </button>
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
  );
}
