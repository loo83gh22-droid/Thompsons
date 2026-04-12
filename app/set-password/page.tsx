"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords don't match." });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        // Session has expired — send them back to request a fresh reset link
        if (error.message.toLowerCase().includes("session") || error.status === 401) {
          setMessage({
            type: "error",
            text: "Your reset link has expired. Please request a new one.",
          });
        } else {
          setMessage({ type: "error", text: error.message });
        }
        return;
      }

      setDone(true);
      setMessage({ type: "success", text: "Password updated! Taking you to your dashboard…" });
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <span>←</span>
          <span className="font-display text-2xl font-semibold">Family Nest</span>
        </Link>

        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          {done ? "Password updated" : "Set a new password"}
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          {done
            ? "You're all set. Heading to your dashboard now."
            : "Choose a strong password for your Family Nest account."}
        </p>

        {!done && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--muted)]">
                New password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pr-12 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-[var(--muted)]">
                Confirm new password
              </label>
              <input
                id="confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                placeholder="Repeat your new password"
              />
            </div>

            {message && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {message.text}
                {message.type === "error" && message.text.includes("expired") && (
                  <span>
                    {" "}
                    <Link href="/forgot-password" className="underline">
                      Request a new link.
                    </Link>
                  </span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[var(--primary)] py-3 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Updating…" : "Set new password"}
            </button>
          </form>
        )}

        {message && done && (
          <div className="mt-8 rounded-lg bg-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
            {message.text}
          </div>
        )}

        {!done && (
          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            <Link href="/login" className="text-[var(--accent)] hover:underline">
              ← Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
