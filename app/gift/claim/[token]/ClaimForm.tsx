"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";

const MIN_PASSWORD_LENGTH = 8;

export function ClaimForm({
  token,
  recipientEmail,
  existingAccount,
}: {
  token: string;
  recipientEmail: string;
  existingAccount: boolean;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Existing-account path: don't show the password form. Send them
  // through sign-in instead, with a redirect back to this same claim
  // URL so the gift can be applied to their existing account.
  if (existingAccount) {
    const claimReturnUrl = `/gift/claim/${encodeURIComponent(token)}`;
    return (
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <p
          className="text-sm font-semibold uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          You already have a Family Nest
        </p>
        <p
          className="mt-3 text-base leading-relaxed"
          style={{ color: "var(--foreground)" }}
        >
          We found an account for{" "}
          <strong>{recipientEmail}</strong>. Sign in to apply your gift —
          your existing Nest will be upgraded to Legacy (lifetime access,
          10 GB storage).
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(claimReturnUrl)}`}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          Sign in &amp; apply your gift
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/gift/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Race condition: account got created between page load and
        // submit. Send them through the sign-in path with a redirect
        // back to this claim URL so the gift can be applied to their
        // existing account.
        if (data.error === "existing_user_signin_required") {
          const claimReturnUrl = `/gift/claim/${encodeURIComponent(token)}`;
          window.location.href = `/login?next=${encodeURIComponent(claimReturnUrl)}`;
          return;
        }
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      // The API created the auth user with email_confirm=true, but
      // didn't set a session cookie. Sign in client-side to establish
      // the session, then redirect to the dashboard.
      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: recipientEmail,
        password,
      });

      if (signInErr) {
        // Account was created but sign-in failed. They can sign in
        // manually with the password they just set.
        window.location.href = `/login?email=${encodeURIComponent(recipientEmail)}&next=${encodeURIComponent("/dashboard?welcome=gift")}`;
        return;
      }

      window.location.href = "/dashboard?welcome=gift";
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-6"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <p
        className="text-sm font-semibold uppercase tracking-widest"
        style={{ color: "var(--accent)" }}
      >
        Set a password to claim your Nest
      </p>

      <div className="mt-5">
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={recipientEmail}
          readOnly
          className="w-full cursor-not-allowed rounded-lg border px-4 py-3 text-base opacity-70"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          Choose a password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-lg border px-4 py-3 text-base"
          style={{
            backgroundColor: "var(--background)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        />
        <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
          At least {MIN_PASSWORD_LENGTH} characters.
        </p>
      </div>

      <div className="mt-4">
        <label
          htmlFor="confirmPassword"
          className="mb-1.5 block text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-lg border px-4 py-3 text-base"
          style={{
            backgroundColor: "var(--background)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        />
      </div>

      {error && (
        <div
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm"
          style={{ color: "var(--foreground)" }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-full px-8 py-4 text-base font-semibold shadow-lg transition-all duration-200 hover:brightness-110 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: "var(--accent)", color: "#fff" }}
      >
        {submitting ? "Setting up your Nest…" : "Open my Family Nest"}
      </button>

      <p
        className="mt-4 text-center text-xs leading-relaxed"
        style={{ color: "var(--muted)" }}
      >
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
