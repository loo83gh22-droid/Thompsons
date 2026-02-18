"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignUp = searchParams.get("mode") === "signup";
  const next = searchParams.get("next") ?? "/dashboard";

  const [familyName, setFamilyName] = useState("");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [email, setEmail] = useState("");
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
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
            data: { full_name: name.trim(), relationship: relationship.trim() || undefined, family_name: familyName.trim() || undefined },
          },
        });
        if (error) throw error;
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
            <p className="font-display text-xl font-semibold text-[var(--foreground)]">
              Check your email
            </p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              We sent a confirmation link to your email. Click it to activate your account, then sign in.
            </p>
            <p className="mt-4 text-xs text-[var(--muted)]">
              Didn&apos;t get it? Check spam, or try signing up again with the same email.
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
                  Your relationship
                </label>
                <input
                  id="relationship"
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="e.g. Mom, Dad, Child"
                />
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
