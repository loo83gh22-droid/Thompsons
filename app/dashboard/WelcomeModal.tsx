"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const COMPLETED_KEY = "family-nest-welcome-completed";
const STEP_KEY = "family-nest-welcome-step";

export function WelcomeModal({ familyName }: { familyName: string }) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const openModal = useCallback(() => {
    try {
      const savedStep = localStorage.getItem(STEP_KEY);
      if (savedStep) setCurrentStep(parseInt(savedStep, 10));
    } catch { /* ignore */ }
    setOpen(true);
  }, []);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const completed = localStorage.getItem(COMPLETED_KEY);
      if (!completed) {
        openModal();
      }
    } catch {
      setOpen(true);
    }
  }, [openModal]);

  // Listen for "reopen welcome tour" events from other components
  useEffect(() => {
    function handleReopen() {
      openModal();
    }
    window.addEventListener("reopen-welcome-tour", handleReopen);
    return () => window.removeEventListener("reopen-welcome-tour", handleReopen);
  }, [openModal]);

  // Close temporarily — modal will reappear on next visit
  function handleClose() {
    setOpen(false);
  }

  // Mark as permanently completed (only from final step Done button)
  function handleComplete() {
    try {
      localStorage.setItem(COMPLETED_KEY, "true");
      localStorage.removeItem(STEP_KEY);
    } catch { /* ignore */ }
    setOpen(false);
  }

  function handleNext() {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    try {
      localStorage.setItem(STEP_KEY, nextStep.toString());
    } catch { /* ignore */ }
  }

  function handlePrevious() {
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    try {
      localStorage.setItem(STEP_KEY, prevStep.toString());
    } catch { /* ignore */ }
  }

  // Navigate to action link — close temporarily, save step progress
  function handleActionClick() {
    setOpen(false);
  }

  if (!open) return null;

  const steps = [
    {
      title: "Add Your First Family Member",
      description: "Start with the people closest to you. Family members can add photos, stories, and memories.",
      action: "/dashboard/our-family",
      actionText: "Add Family Members",
      icon: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}"
    },
    {
      title: "Upload Your Favorite Photo",
      description: "Your photos become part of the family mosaic and are searchable by faces, places, and dates.",
      action: "/dashboard/photos",
      actionText: "Upload a Photo",
      icon: "\u{1F4F7}"
    },
    {
      title: "Write One Sentence",
      description: "Create your first journal entry. Share a memory, thought, or what happened today.",
      action: "/dashboard/journal/new",
      actionText: "Write Journal Entry",
      icon: "\u270D\uFE0F"
    }
  ];

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

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
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8">
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          aria-label="Close welcome tour"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>

        {/* Progress indicator */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 w-12 rounded-full transition-colors ${
                  idx === currentStep
                    ? "bg-[var(--accent)]"
                    : idx < currentStep
                    ? "bg-[var(--accent)]/50"
                    : "bg-[var(--border)]"
                }`}
              />
            ))}
          </div>
          <span className="mr-6 text-sm font-medium text-[var(--muted)]">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Step content */}
        <div className="text-center">
          <div className="mb-4 text-6xl">{step.icon}</div>
          <h1 id="welcome-title" className="font-display text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
            {step.title}
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            {step.description}
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={step.action}
            onClick={handleActionClick}
            className="min-h-[44px] w-full rounded-full bg-[var(--primary)] px-6 py-3 text-center font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            {step.actionText}
          </Link>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="min-h-[44px] flex-1 rounded-lg border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              >
                Previous
              </button>
            )}
            {isLastStep ? (
              <button
                type="button"
                onClick={handleComplete}
                className="min-h-[44px] flex-1 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90"
              >
                Done — I&apos;m all set!
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="min-h-[44px] flex-1 rounded-lg border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Check if the welcome tour has been completed */
export function isWelcomeTourCompleted(): boolean {
  try {
    return localStorage.getItem(COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
}

/** Dispatch event to reopen the welcome tour */
export function reopenWelcomeTour() {
  window.dispatchEvent(new Event("reopen-welcome-tour"));
}
