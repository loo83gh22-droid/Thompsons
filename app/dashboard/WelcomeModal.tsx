"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "family-nest-welcome-dismissed";
const STEP_KEY = "family-nest-welcome-step";

export function WelcomeModal({ familyName }: { familyName: string }) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const dismissed = localStorage.getItem(STORAGE_KEY);
      const savedStep = localStorage.getItem(STEP_KEY);
      if (!dismissed) {
        setOpen(true);
        if (savedStep) setCurrentStep(parseInt(savedStep, 10));
      }
    } catch {
      setOpen(true);
    }
  }, []);

  function handleDismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      localStorage.removeItem(STEP_KEY);
    } catch {
      // ignore
    }
    setOpen(false);
  }

  function handleNext() {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    try {
      localStorage.setItem(STEP_KEY, nextStep.toString());
    } catch {
      // ignore
    }
  }

  function handlePrevious() {
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    try {
      localStorage.setItem(STEP_KEY, prevStep.toString());
    } catch {
      // ignore
    }
  }

  if (!open) return null;

  const displayName = familyName?.trim() || "Your Family";

  const steps = [
    {
      title: "Add Your First Family Member",
      description: "Start with the people closest to you. Family members can add photos, stories, and memories.",
      action: "/dashboard/our-family",
      actionText: "Add Family Members",
      icon: "👨‍👩‍👧‍👦"
    },
    {
      title: "Upload Your Favorite Photo",
      description: "Your photos become part of the family mosaic and are searchable by faces, places, and dates.",
      action: "/dashboard/photos",
      actionText: "Upload a Photo",
      icon: "📷"
    },
    {
      title: "Write One Sentence",
      description: "Create your first journal entry. Share a memory, thought, or what happened today.",
      action: "/dashboard/journal/new",
      actionText: "Write Journal Entry",
      icon: "✍️"
    }
  ];

  const step = steps[currentStep];

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
          <span className="text-sm font-medium text-[var(--muted)]">
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
            onClick={handleDismiss}
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
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="min-h-[44px] flex-1 rounded-lg border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDismiss}
                className="min-h-[44px] flex-1 rounded-lg border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              >
                I&apos;ll explore later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
