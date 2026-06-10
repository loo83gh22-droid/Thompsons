"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { quickInvite } from "./members/actions";

const DISMISSED_COOKIE = "fn_first_win_dismissed";
const COOKIE_DAYS = 365;

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * FirstWinPrompt — fires once after a user posts their first entry of
 * any kind (journal / photo / voice memo) but BEFORE they've invited
 * anyone. Single-use modal that captures the highest-intent invite
 * window we have: the 30 seconds after a user just felt the
 * satisfaction of putting their first piece of content into the Nest.
 *
 * Dismissal is sticky (1-year cookie) so we never nag.
 */
export function FirstWinPrompt({
  hasFirstEntry,
  memberCount,
  ownerFirstName,
}: {
  hasFirstEntry: boolean;
  memberCount: number;
  ownerFirstName: string | null;
}) {
  // Don't render anything during SSR — gating is cookie-based, and we
  // want the modal to show *after* hydration so first-paint isn't
  // overlaid with a modal that flashes away on cookie-read.
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    // Defer past hydration so the modal doesn't flash during SSR.
    // The setState calls here are intentional — we need to read the
    // cookie (browser-only) and only then decide whether to open.
    // This mirrors the pattern used by OnboardingChecklist.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
    const dismissed = getCookie(DISMISSED_COOKIE) === "true";
    if (hasFirstEntry && memberCount < 2 && !dismissed) {
      setOpen(true);
    }
  }, [hasFirstEntry, memberCount]);

  function close() {
    setCookie(DISMISSED_COOKIE, "true", COOKIE_DAYS);
    setOpen(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await quickInvite(name, email);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Couldn't send invite.");
      return;
    }
    setSent(true);
    setInviteUrl(result.inviteUrl ?? null);
    setCookie(DISMISSED_COOKIE, "true", COOKIE_DAYS);
    // We intentionally do NOT auto-close: if we captured a shareable
    // invite link, the owner should have time to copy/text it. Email
    // deliverability is unreliable, so a textable link materially lifts
    // the odds the invite is actually accepted.
  }

  function copyLink() {
    if (!inviteUrl) return;
    navigator.clipboard?.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function shareLink() {
    if (!inviteUrl || typeof navigator === "undefined" || !navigator.share) return;
    navigator
      .share({
        title: "Join our Family Nest",
        text: `Join our family on Family Nest:`,
        url: inviteUrl,
      })
      .catch(() => {
        /* user cancelled */
      });
  }

  if (!mounted || !open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-win-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-[var(--card)] shadow-2xl sm:rounded-3xl">
        <div className="relative px-6 pt-7 pb-6 sm:px-8">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)]"
          >
            <span aria-hidden>×</span>
          </button>

          {sent ? (
            <div className="py-2 text-center">
              <div className="text-4xl">📬</div>
              <h2
                id="first-win-title"
                className="mt-3 font-display text-xl font-semibold text-[var(--foreground)]"
              >
                Invite sent
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                We emailed {name.split(" ")[0] || "them"} a link to join your Nest.
                {inviteUrl ? " Want to make sure they get it?" : ""}
              </p>

              {inviteUrl && (
                <div className="mt-4 text-left">
                  <p className="mb-2 text-xs text-[var(--muted)]">
                    Send {name.split(" ")[0] || "them"} this link directly — texting it
                    beats an email that might land in spam.
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                    <span className="flex-1 truncate text-xs text-[var(--muted)] select-all">
                      {inviteUrl}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={copyLink}
                      className="flex-1 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      {copied ? "Copied!" : "Copy link"}
                    </button>
                    {canNativeShare && (
                      <button
                        type="button"
                        onClick={shareLink}
                        className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: "var(--accent)" }}
                      >
                        Share…
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-5 text-xs text-[var(--muted)] hover:underline"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="text-3xl" aria-hidden>
                🌱
              </div>
              <h2
                id="first-win-title"
                className="mt-2 font-display text-xl font-semibold text-[var(--foreground)] sm:text-2xl"
              >
                {ownerFirstName ? `Nice one, ${ownerFirstName}.` : "Nice one."} Your Nest has its first chapter.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Family Nest gets quietly better when there&apos;s someone reading
                too. Invite your partner, a sibling, anyone — they&apos;ll see
                what you just added.
              </p>

              <form onSubmit={onSubmit} className="mt-5 space-y-3">
                <div>
                  <label
                    htmlFor="fw-name"
                    className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
                  >
                    Their name
                  </label>
                  <input
                    id="fw-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    autoComplete="off"
                    className="w-full rounded-lg border px-4 py-2.5 text-base"
                    style={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="fw-email"
                    className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
                  >
                    Their email
                  </label>
                  <input
                    id="fw-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    autoComplete="email"
                    className="w-full rounded-lg border px-4 py-2.5 text-base"
                    style={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm"
                    style={{ color: "var(--foreground)" }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full px-6 py-3 text-sm font-semibold shadow transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                >
                  {submitting ? "Sending…" : "Send invite"}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={close}
                  className="text-[var(--muted)] hover:underline"
                >
                  Maybe later
                </button>
                <Link
                  href="/dashboard/our-family"
                  className="text-[var(--accent)] hover:underline"
                  onClick={() => setCookie(DISMISSED_COOKIE, "true", COOKIE_DAYS)}
                >
                  Add details →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
