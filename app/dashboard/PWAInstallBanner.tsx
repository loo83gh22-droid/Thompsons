"use client";

import { useEffect, useState } from "react";
import { X, Share } from "lucide-react";

const DISMISSED_KEY = "pwa_banner_dismissed";
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already installed — don't show
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Desktop — don't show
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Recently dismissed — don't show
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed && Date.now() - parseInt(dismissed) < DISMISS_DURATION_MS)
      return;

    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      // iOS doesn't fire beforeinstallprompt — show instructions immediately
      setShow(true);
    } else {
      // Android / Chrome — wait for the native install prompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShow(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-sm"
      style={{ backgroundColor: "var(--accent)", color: "#fff" }}
    >
      <span className="flex-1 leading-snug">
        {isIOS ? (
          <>
            Tap{" "}
            <Share
              className="inline-block w-3.5 h-3.5 mx-0.5 -mt-0.5"
              aria-hidden
            />{" "}
            then <strong>Add to Home Screen</strong> for the best experience
          </>
        ) : (
          <>
            <button
              onClick={handleInstall}
              className="font-semibold underline underline-offset-2 hover:opacity-80"
            >
              Add to your home screen
            </button>{" "}
            for the best experience
          </>
        )}
      </span>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss install banner"
        className="shrink-0 opacity-80 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
