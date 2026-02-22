"use client";

import { useState } from "react";

/* ─── Social icon SVGs ─── */

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* ─── Main component ─── */

export function ShareButton({
  isPublic,
  shareToken,
  shareType,
  title,
  onToggle,
}: {
  isPublic: boolean;
  shareToken: string | null;
  shareType: "story" | "recipe";
  title?: string;
  onToggle: () => Promise<{ shareToken: string | null; isPublic: boolean }>;
}) {
  const [loading, setLoading] = useState(false);
  const [currentIsPublic, setCurrentIsPublic] = useState(isPublic);
  const [currentToken, setCurrentToken] = useState(shareToken);
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const shareUrl = currentToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareType}/${currentToken}`
    : null;

  async function handleToggle() {
    setLoading(true);
    try {
      const result = await onToggle();
      setCurrentIsPublic(result.isPublic);
      setCurrentToken(result.shareToken);
      if (result.isPublic) setShowPanel(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update sharing");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleFacebook() {
    if (!shareUrl) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
  }

  function handleNativeShare() {
    if (!shareUrl || !navigator.share) return;
    const shareTitle = title
      ? `${title} — Family Nest`
      : `A family ${shareType} from Family Nest`;
    navigator.share({
      title: shareTitle,
      text: `Check out this ${shareType} from our Family Nest`,
      url: shareUrl,
    }).catch(() => {/* user cancelled */});
  }

  // ── Not shared yet ──
  if (!currentIsPublic) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:opacity-50 transition-colors"
      >
        <ShareIcon className="h-4 w-4" />
        {loading ? "Creating link…" : "Share outside Family Nest"}
      </button>
    );
  }

  // ── Shared — show social options ──
  return (
    <div className="space-y-3">
      {/* Toggle panel visibility */}
      <button
        type="button"
        onClick={() => setShowPanel(!showPanel)}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-colors"
      >
        <ShareIcon className="h-4 w-4" />
        Shared publicly
        <svg className={`h-3 w-3 transition-transform ${showPanel ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 5l3 3 3-3" /></svg>
      </button>

      {showPanel && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Privacy notice */}
          <div className="flex items-start gap-2.5 rounded-lg bg-[var(--accent)]/8 p-3">
            <LockIcon className="h-4 w-4 mt-0.5 shrink-0 text-[var(--accent)]" />
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              <span className="font-semibold text-[var(--foreground)]">Your Family Nest is private.</span>{" "}
              Only this single {shareType} is visible via the link below. Nothing else in your Nest can be seen.
            </p>
          </div>

          {/* Share actions */}
          <div className="flex flex-wrap gap-2">
            {/* Facebook */}
            <button
              type="button"
              onClick={handleFacebook}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1877F2]/10 px-3.5 py-2 text-sm font-medium text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors"
            >
              <FacebookIcon className="h-4 w-4" />
              Facebook
            </button>

            {/* Native share (mobile — surfaces Instagram, WhatsApp, etc.) */}
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--surface-hover)] px-3.5 py-2 text-sm font-medium text-[var(--foreground)] hover:opacity-80 transition-colors"
              >
                <ShareIcon className="h-4 w-4" />
                More…
              </button>
            )}

            {/* Copy link */}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3.5 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <LinkIcon className="h-4 w-4" />
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>

          {/* URL preview */}
          {shareUrl && (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
              <LinkIcon className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
              <span className="truncate text-xs text-[var(--muted)] select-all">{shareUrl}</span>
            </div>
          )}

          {/* Stop sharing */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={loading}
            className="text-xs text-red-400 hover:text-red-300 hover:underline disabled:opacity-50 transition-colors"
          >
            {loading ? "Removing…" : "Stop sharing this " + shareType}
          </button>
        </div>
      )}
    </div>
  );
}
