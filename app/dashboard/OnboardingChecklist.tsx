"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Confetti from "react-confetti";
import { isWelcomeTourCompleted, reopenWelcomeTour } from "./WelcomeModal";

const ARCHIVED_COOKIE = "fn_onboarding_archived";
const HIDDEN_KEY = "family-nest-onboarding-hidden";
const CELEBRATED_KEY = "family-nest-onboarding-celebrated";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((row) => row.startsWith(name + "="))?.split("=")[1];
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export function OnboardingChecklist({
  memberCount,
  journalCount,
  storyCount,
  photoCount,
}: {
  memberCount: number;
  journalCount: number;
  storyCount: number;
  photoCount: number;
}) {
  const [archived, setArchived] = useState(() => {
    try {
      // Migrate old localStorage dismissed/archived flags to cookie
      const oldDismissed = localStorage.getItem("family-nest-onboarding-dismissed");
      const oldArchived = localStorage.getItem("family-nest-onboarding-archived");
      if (oldDismissed === "true" || oldArchived === "true") {
        setCookie(ARCHIVED_COOKIE, "true", 365);
        localStorage.removeItem("family-nest-onboarding-dismissed");
        localStorage.removeItem("family-nest-onboarding-archived");
      }
      return getCookie(ARCHIVED_COOKIE) === "true";
    } catch {
      return false;
    }
  });
  const [sessionHidden, setSessionHidden] = useState(() => {
    try {
      return sessionStorage.getItem(HIDDEN_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

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

  const step1Done = memberCount >= 2;
  const step2Done = journalCount >= 1;
  const step3Done = photoCount >= 1;
  const allDone = step1Done && step2Done && step3Done;

  // Auto-archive and celebrate when all steps are complete
  useEffect(() => {
    if (allDone) {
      try {
        const alreadyCelebrated = localStorage.getItem(CELEBRATED_KEY) === "true";
        if (!alreadyCelebrated) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setShowConfetti(true);
          localStorage.setItem(CELEBRATED_KEY, "true");
          // Auto-hide confetti after 5 seconds
          setTimeout(() => setShowConfetti(false), 5000);
        }
        setCookie(ARCHIVED_COOKIE, "true", 365);
      } catch { /* ignore */ }
    }
  }, [allDone]);

  // Don't show if archived or session-hidden
  if (archived || sessionHidden) return null;

  // All done — show confetti briefly, then disappear
  if (allDone) {
    if (!showConfetti) return null;
    return (
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={200}
        recycle={false}
        gravity={0.3}
      />
    );
  }

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
      setCookie(ARCHIVED_COOKIE, "true", 365);
    } catch {
      // ignore
    }
  }

  // Determine the single nudge to show.
  // Order matters: lead with capture (journal) so the user gets a
  // real moment of value before being asked to invite anyone. Once
  // they've written something, photos are a natural next step. Adding
  // the people in your home comes last — by then there's actually a
  // Nest worth sharing.
  const nextNudge = !step2Done
    ? { icon: "📔", text: "Just one sentence about today is enough. It becomes a memory you'll come back to.", href: "/dashboard/journal/new", cta: "Write something" }
    : !step3Done
    ? { icon: "📸", text: "Drop in a favourite from your camera roll — something from this week, this year, or years ago.", href: "/dashboard/photos", cta: "Add a photo" }
    : !step1Done
    ? { icon: "👨‍👩‍👧", text: "Now that there's something here, invite the people you come home to.", href: "/dashboard/our-family", cta: "Add the family" }
    : null;

  if (!nextNudge) return null;

  return (
    <>
      {showConfetti && (
        <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={200} recycle={false} gravity={0.3} />
      )}
      <section className="rounded-xl border border-[var(--accent)]/20 bg-[var(--surface)] p-5">
        <div className="flex items-start gap-4">
          <span className="text-2xl">{nextNudge.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--foreground)] leading-relaxed">{nextNudge.text}</p>
            <div className="mt-3 flex items-center gap-3">
              <Link
                href={nextNudge.href}
                className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                {nextNudge.cta} →
              </Link>
              <ResumeWelcomeTourLink />
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <button onClick={handleHide} className="rounded px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)]">Hide</button>
            <button onClick={handleArchive} className="rounded px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)]">✕</button>
          </div>
        </div>
      </section>
    </>
  );
}

function ResumeWelcomeTourLink() {
  const [showLink] = useState(() => !isWelcomeTourCompleted());

  if (!showLink) return null;

  return (
    <button
      type="button"
      onClick={() => reopenWelcomeTour()}
      className="mt-4 flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
    >
      <span aria-hidden>&#x1F3E0;</span>
      Resume Welcome Tour
    </button>
  );
}
