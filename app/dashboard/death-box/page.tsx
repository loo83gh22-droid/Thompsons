"use client";

import { useState } from "react";
import { DeathBoxChecklist } from "./DeathBoxChecklist";

export default function DeathBoxPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    const correctPassword =
      process.env.NEXT_PUBLIC_DEATH_BOX_PASSWORD || "family";
    if (password === correctPassword) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Incorrect password.");
    }
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          Da Box
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Sensitive information. Wills, documents, final wishes. Password required.
        </p>

        <form onSubmit={handleUnlock} className="mt-12 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--muted)]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              placeholder="Enter password"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--accent)] py-3 font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)]"
          >
            Unlock
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Set NEXT_PUBLIC_DEATH_BOX_PASSWORD in .env for production. Default: &quot;family&quot;
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Da Box
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Checklist of documents and wishes. Check off items and upload files as you complete them.
          </p>
        </div>
        <button
          onClick={() => setUnlocked(false)}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        >
          Lock
        </button>
      </div>

      <div className="mt-12">
        <DeathBoxChecklist />
      </div>
    </div>
  );
}
