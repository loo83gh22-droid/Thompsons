"use client";

import { useState } from "react";
import { createShareableInvite } from "./actions";

/**
 * ShareableInviteLink — owner/adult entry point for the email-less invite.
 *
 * For when you want to add someone but don't have (or don't want to type)
 * their email: name them, get a link, and text it. They open it, enter their
 * own email + password, and join. Complements the standard email invite in
 * AddMemberForm.
 */
export function ShareableInviteLink() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  async function create() {
    setLoading(true);
    setError(null);
    const res = await createShareableInvite(name);
    setLoading(false);
    if (!res.ok || !res.url) {
      setError(res.error || "Couldn't create the link. Try again.");
      return;
    }
    setUrl(res.url);
  }

  function copy() {
    if (!url) return;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function share() {
    if (!url || !navigator.share) return;
    navigator.share({ title: "Join our Family Nest", text: "Join our family on Family Nest:", url }).catch(() => {});
  }

  function reset() {
    setUrl(null);
    setName("");
    setError(null);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-[var(--accent)] hover:underline"
      >
        Don&apos;t have their email? Create an invite link →
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      {url ? (
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            Here&apos;s {name.trim() || "their"} invite link
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Text or message it to them. They&apos;ll add their own email and password to join.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
            <span className="flex-1 truncate text-xs text-[var(--muted)] select-all">{url}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)]"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            {canShare && (
              <button
                type="button"
                onClick={share}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--accent)" }}
              >
                Share…
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="rounded-full px-4 py-2 text-sm text-[var(--muted)] hover:underline"
            >
              Create another
            </button>
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor="sil-name" className="block text-sm font-medium text-[var(--foreground)]">
            Who&apos;s this for?
          </label>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Just a name — they&apos;ll fill in the rest when they open the link.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="sil-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grandpa Joe"
              className="flex-1 rounded-lg border px-3 py-2 text-base"
              style={{ backgroundColor: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            <button
              type="button"
              onClick={create}
              disabled={loading}
              className="shrink-0 rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {loading ? "Creating…" : "Create link"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 text-xs text-[var(--muted)] hover:underline"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
