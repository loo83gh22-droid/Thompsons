"use client";

import { useState } from "react";

export function ShareButton({
  isPublic,
  shareToken,
  shareType,
  onToggle,
}: {
  isPublic: boolean;
  shareToken: string | null;
  shareType: "story" | "recipe";
  onToggle: () => Promise<{ shareToken: string | null; isPublic: boolean }>;
}) {
  const [loading, setLoading] = useState(false);
  const [currentIsPublic, setCurrentIsPublic] = useState(isPublic);
  const [currentToken, setCurrentToken] = useState(shareToken);
  const [copied, setCopied] = useState(false);

  const shareUrl = currentToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareType}/${currentToken}`
    : null;

  async function handleToggle() {
    setLoading(true);
    try {
      const result = await onToggle();
      setCurrentIsPublic(result.isPublic);
      setCurrentToken(result.shareToken);
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
          currentIsPublic
            ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
            : "bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
      >
        {loading ? "..." : currentIsPublic ? "Shared publicly" : "Share publicly"}
      </button>

      {currentIsPublic && shareUrl && (
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)]"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      )}

      {currentIsPublic && (
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          className="rounded-lg px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          Stop sharing
        </button>
      )}
    </div>
  );
}
