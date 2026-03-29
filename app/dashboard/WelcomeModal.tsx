"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { setUserTheme } from "@/app/dashboard/settings/actions";

const COMPLETED_KEY = "family-nest-welcome-completed";
const THEME_STEP_KEY = "family-nest-welcome-theme-done";

type ThemeId = "warm" | "ocean" | "forest" | "sunset" | "lavender" | "midnight" | "vintage" | "nineties";

const THEMES: { id: ThemeId; name: string; emoji: string; colors: [string, string, string] }[] = [
  { id: "warm",     name: "Warm",     emoji: "🍂", colors: ["hsl(40,25%,92%)",   "hsl(160,36%,26%)",  "hsl(24,65%,48%)"]  },
  { id: "ocean",    name: "Ocean",    emoji: "🌊", colors: ["hsl(205,30%,92%)",  "hsl(200,50%,30%)",  "hsl(190,55%,38%)"] },
  { id: "forest",   name: "Forest",   emoji: "🌲", colors: ["hsl(140,18%,91%)",  "hsl(155,40%,25%)",  "hsl(135,45%,35%)"] },
  { id: "sunset",   name: "Sunset",   emoji: "🌅", colors: ["hsl(15,30%,92%)",   "hsl(350,45%,35%)",  "hsl(15,70%,50%)"]  },
  { id: "lavender", name: "Lavender", emoji: "💜", colors: ["hsl(265,20%,93%)",  "hsl(280,35%,35%)",  "hsl(275,45%,48%)"] },
  { id: "midnight", name: "Midnight", emoji: "🌙", colors: ["hsl(220,20%,14%)",  "hsl(210,50%,55%)",  "hsl(35,60%,55%)"]  },
  { id: "vintage",  name: "Vintage",  emoji: "📷", colors: ["hsl(38,30%,88%)",   "hsl(15,40%,32%)",   "hsl(30,50%,42%)"]  },
  { id: "nineties", name: "90s",      emoji: "📼", colors: ["hsl(185,85%,84%)",  "hsl(325,100%,50%)", "hsl(135,100%,36%)"] },
];

function applyThemeToDom(themeId: ThemeId) {
  if (themeId === "warm") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", themeId);
  }
}

export function WelcomeModal({
  familyName,
  memberCount,
  journalCount,
}: {
  familyName: string;
  memberCount: number;
  journalCount: number;
}) {
  const [open, setOpen] = useState(false);
  // 0 = theme, 1 = invite, 2 = journal
  const [step, setStep] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("warm");
  const [isPending, startTransition] = useTransition();

  const step1Done = memberCount >= 2;
  const step2Done = journalCount >= 1;
  const allDone = step1Done && step2Done;

  const openModal = useCallback(() => {
    // Start at the right step: if theme already picked, go to first incomplete data step
    try {
      const themeDone = localStorage.getItem(THEME_STEP_KEY) === "true";
      if (themeDone) {
        if (!step1Done) setStep(1);
        else if (!step2Done) setStep(2);
        else return; // all done, don't open
      } else {
        setStep(0);
      }
    } catch {
      setStep(0);
    }
    setOpen(true);
  }, [step1Done, step2Done]);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (allDone) return;
      const completed = localStorage.getItem(COMPLETED_KEY);
      if (!completed) openModal();
    } catch {
      setOpen(true);
    }
  }, [openModal, allDone]);

  useEffect(() => {
    function handleReopen() { openModal(); }
    window.addEventListener("reopen-welcome-tour", handleReopen);
    return () => window.removeEventListener("reopen-welcome-tour", handleReopen);
  }, [openModal]);

  function handleClose() { setOpen(false); }

  function handleComplete() {
    try {
      localStorage.setItem(COMPLETED_KEY, "true");
    } catch { /* ignore */ }
    setOpen(false);
  }

  function handleThemeSelect(themeId: ThemeId) {
    setSelectedTheme(themeId);
    applyThemeToDom(themeId);
    startTransition(async () => {
      await setUserTheme(themeId);
    });
  }

  function handleThemeNext() {
    try { localStorage.setItem(THEME_STEP_KEY, "true"); } catch { /* ignore */ }
    setStep(1);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden
        onClick={handleClose}
      />

      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="flex h-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex-1 transition-colors duration-500"
              style={{ backgroundColor: i <= step ? "var(--accent)" : "var(--border)" }}
            />
          ))}
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>

        {/* ── STEP 0: Theme ── */}
        {step === 0 && (
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Step 1 of 3</p>
            <h1 id="welcome-title" className="mt-2 font-display text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
              Welcome to {familyName} Nest 👋
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              First things first — pick a look. You can always change this later in Settings.
            </p>

            {/* Theme grid */}
            <div className="mt-5 grid grid-cols-4 gap-2">
              {THEMES.map((t) => {
                const isSelected = selectedTheme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleThemeSelect(t.id)}
                    disabled={isPending}
                    className={`group relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-all ${
                      isSelected
                        ? "border-[var(--accent)] shadow-md scale-105"
                        : "border-[var(--border)] hover:border-[var(--accent)]/50 hover:scale-102"
                    }`}
                  >
                    {/* Color swatch */}
                    <div className="flex w-full gap-0.5 rounded-md overflow-hidden h-5">
                      {t.colors.map((c, i) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--foreground)] leading-tight">{t.name}</span>
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[8px] text-[var(--accent-foreground)]">✓</div>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-center text-xs text-[var(--muted)]">
              {isPending ? "Saving..." : "The whole site previews as you click ✨"}
            </p>

            <button
              type="button"
              onClick={handleThemeNext}
              className="mt-5 min-h-[48px] w-full rounded-full bg-[var(--primary)] px-6 py-3 text-center font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
            >
              Looking good — next up →
            </button>
          </div>
        )}

        {/* ── STEP 1: Invite ── */}
        {step === 1 && (
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Step 2 of 3</p>
            <h1 id="welcome-title" className="mt-2 font-display text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
              Start with who&apos;s in your home
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Add the people you come home to — your partner, your kids. Extended family and others can be added as contacts later, so you can share things with them without giving them full access.
            </p>

            {/* Visual: seats */}
            <div className="mt-6 flex items-center justify-center gap-3">
              {["You", "Partner", "Kid", "Kid"].map((label, i) => (
                <div key={i} className={`flex flex-col items-center gap-1 ${i === 0 ? "opacity-100" : "opacity-40"}`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl border-2 ${
                    i === 0 ? "border-[var(--accent)] bg-[var(--surface)]" : "border-dashed border-[var(--border)] bg-[var(--surface)]"
                  }`}>
                    {i === 0 ? "😊" : "+"}
                  </div>
                  <span className="text-[10px] text-[var(--muted)]">{label}</span>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard/our-family"
              onClick={handleClose}
              className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-full bg-[var(--primary)] px-6 py-3 text-center font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
            >
              Add the people in your nest →
            </Link>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="min-h-[44px] flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[44px] flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: First memory ── */}
        {step === 2 && (
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Step 3 of 3</p>
            <h1 id="welcome-title" className="mt-2 font-display text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
              Write your first memory
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              It doesn&apos;t have to be perfect. One sentence about today — or a memory you&apos;ve been meaning to write down. That&apos;s it.
            </p>

            {/* Prompt ideas */}
            <div className="mt-5 space-y-2">
              {[
                "Something funny one of the kids said this week…",
                "A memory I never want to forget…",
                "What we did this weekend…",
              ].map((prompt, i) => (
                <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--muted)] italic">
                  &ldquo;{prompt}&rdquo;
                </div>
              ))}
            </div>

            <Link
              href="/dashboard/journal/new"
              onClick={handleClose}
              className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-center font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
            >
              Write my first memory →
            </Link>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[44px] flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleComplete}
                className="min-h-[44px] flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              >
                I&apos;ll explore on my own
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function isWelcomeTourCompleted(): boolean {
  try {
    return localStorage.getItem(COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
}

export function reopenWelcomeTour() {
  window.dispatchEvent(new Event("reopen-welcome-tour"));
}
