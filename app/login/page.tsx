"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoMark } from "@/app/components/LogoMark";
import { createClient } from "@/src/lib/supabase/client";
import { RELATIONSHIP_OPTIONS } from "@/app/dashboard/members/constants";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const isSignUp = mode === "signup";
  const isInvited = mode === "invited";
  const next = searchParams.get("next") ?? "/dashboard";

  // Pre-fill from invite link params
  const inviteEmail = searchParams.get("email") ?? "";
  const inviteFamily = searchParams.get("family") ?? "";
  const inviteName = searchParams.get("name") ?? "";

  const [familyName, setFamilyName] = useState("");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [email, setEmail] = useState(isInvited ? inviteEmail : "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isInvited) {
        // Invited user: sign up using their pre-set email, no new family needed
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            name: inviteName.trim() || undefined,
            isInvited: true, // tells signup route to skip the "new family" admin notification
            // No familyName — dashboard layout will link them to the existing family member row
            redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signup failed");
        setSignUpSuccess(true);
      } else if (isSignUp) {
        // Use our custom signup API to send branded confirmation email
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name: name.trim(),
            familyName: familyName.trim(),
            relationship: relationship.trim() || undefined,
            redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signup failed");
        setSignUpSuccess(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next.startsWith("/") ? next : "/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  // ── Invited user flow ──────────────────────────────────────────────────────
  if (isInvited) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <LogoMark size={32} />
            <span className="font-display text-2xl font-semibold">Family Nest</span>
          </Link>

          {signUpSuccess ? (
            <div className="rounded-xl border-2 border-[var(--accent)]/40 bg-[var(--accent)]/10 px-6 py-8 text-center">
              <p className="text-4xl">🎉</p>
              <p className="mt-3 font-display text-xl font-semibold text-[var(--foreground)]">
                Almost there!
              </p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                We sent a confirmation email to{" "}
                <strong className="text-[var(--foreground)]">{email}</strong>.
                Click the link inside to activate your account and access{" "}
                {inviteFamily ? (
                  <strong className="text-[var(--foreground)]">{inviteFamily}&apos;s Nest</strong>
                ) : (
                  "your family&apos;s Nest"
                )}
                .
              </p>
              <p className="mt-4 text-xs text-[var(--muted)]">
                Don&apos;t see it? Check your spam folder — it&apos;s from <strong>Family Nest</strong>.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block rounded-full bg-[var(--primary)] px-6 py-2 font-medium text-[var(--primary-foreground)] hover:opacity-90"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {/* Invite banner */}
              <div className="mb-6 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                  You&apos;ve been invited
                </p>
                <p className="mt-1 text-base font-semibold text-[var(--foreground)]">
                  {inviteFamily ? (
                    <>Join <span className="text-[var(--accent)]">{inviteFamily}</span>&apos;s Family Nest</>
                  ) : (
                    "Join your Family Nest"
                  )}
                </p>
                {inviteName && (
                  <p className="mt-0.5 text-sm text-[var(--muted)]">
                    Welcome, <strong className="text-[var(--foreground)]">{inviteName}</strong> — your profile is already set up.
                  </p>
                )}
              </div>

              <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">
                Create your password
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                That&apos;s all you need — your email is recognised and your profile is ready.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Email — pre-filled and read-only */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--muted)]">
                    Your email
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      readOnly={!!inviteEmail}
                      required
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] read-only:opacity-70 read-only:cursor-default"
                      placeholder="you@example.com"
                    />
                    {inviteEmail && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--accent)]">
                        ✓ confirmed
                      </span>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[var(--muted)]">
                    Create a password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    placeholder="Choose a secure password"
                  />
                </div>

                {message && (
                  <div
                    className={`rounded-lg px-4 py-3 text-sm ${
                      message.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[var(--primary)] py-3 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Setting up your account…" : inviteFamily ? `Join ${inviteFamily}'s Nest →` : "Access my Family Nest →"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[var(--muted)]">
                Already have an account?{" "}
                <Link href="/login" className="text-[var(--accent)] hover:underline">
                  Sign in
                </Link>
              </p>

              <p className="mt-8 text-center text-xs text-[var(--muted)]">
                <Link href="/terms" className="hover:text-[var(--foreground)]">Terms</Link>
                {" · "}
                <Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy</Link>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Standard sign-in / sign-up flow ────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <span>←</span>
          <span className="font-display text-2xl font-semibold">Family Nest</span>
        </Link>

        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          {isSignUp ? "Sign up our Family" : "Welcome back"}
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          {isSignUp
            ? "Create your family site. Add members after signing up."
            : "Sign in to access your family site."}
        </p>

        {isSignUp && signUpSuccess ? (
          <div className="mt-8 rounded-xl border-2 border-[var(--accent)]/40 bg-[var(--accent)]/10 px-6 py-8 text-center">
            <p className="text-4xl">&#127881;</p>
            <p className="mt-3 font-display text-xl font-semibold text-[var(--foreground)]">
              Almost there!
            </p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              We just sent a beautiful confirmation email to <strong className="text-[var(--foreground)]">{email}</strong>. Click the link inside to activate your Family Nest.
            </p>
            <p className="mt-4 text-xs text-[var(--muted)]">
              Don&apos;t see it? Check your spam folder — it&apos;s from <strong>Family Nest</strong>.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-full bg-[var(--primary)] px-6 py-2 font-medium text-[var(--primary-foreground)] hover:opacity-90"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {isSignUp && (
            <>
              <div>
                <label htmlFor="familyName" className="block text-sm font-medium text-[var(--muted)]">
                  Family name
                </label>
                <input
                  id="familyName"
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="e.g. Thompsons"
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[var(--muted)]">
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="e.g. Sarah"
                />
              </div>
              <div>
                <label htmlFor="relationship" className="block text-sm font-medium text-[var(--muted)]">
                  Your role in the family
                </label>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  Pick your role in the family. Choose &quot;Me&quot; if you&apos;re adding yourself, or your family role like &quot;Father&quot; or &quot;Mother&quot;.
                </p>
                <select
                  id="relationship"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">Select your role…</option>
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--muted)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--muted)]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[var(--accent)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--primary)] py-3 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "..." : isSignUp ? "Sign up our Family" : "Sign in"}
          </button>
        </form>
        )}

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--accent)] hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/login?mode=signup" className="text-[var(--accent)] hover:underline">
                Sign up our Family
              </Link>
            </>
          )}
        </p>

        <p className="mt-8 text-center text-xs text-[var(--muted)]">
          <Link href="/terms" className="hover:text-[var(--foreground)]">Terms</Link>
          {" · "}
          <Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-[var(--muted)]">Loading...</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
