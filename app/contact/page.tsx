"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/app/components/home/Navbar";
import { Footer } from "@/app/components/home/Footer";

const CATEGORIES = [
  "General Question",
  "Bug Report",
  "Billing / Account",
  "Feature Request",
  "Other",
];

function ContactForm() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: CATEGORIES[0],
    message: "",
  });
  const [errorId, setErrorId] = useState<string | undefined>();

  useEffect(() => {
    const cat = searchParams.get("category");
    const eid = searchParams.get("errorId") ?? undefined;
    if (cat && CATEGORIES.includes(cat)) {
      setForm((prev) => ({ ...prev, category: cat }));
    }
    if (eid) {
      setErrorId(eid);
      setForm((prev) => ({
        ...prev,
        message: `Error ID: ${eid}\n\nWhat I was doing:\n`,
      }));
    }
  }, [searchParams]);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, errorId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      {status === "success" ? (
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-900/20 text-3xl">
            ✅
          </div>
          <h1
            className="text-2xl font-bold text-[var(--foreground)] mb-3"
            style={{ fontFamily: "var(--font-display-serif)" }}
          >
            Message sent!
          </h1>
          <p className="text-sm text-[var(--muted)] leading-relaxed mb-8">
            Thanks for reaching out. We&apos;ve sent you a confirmation — we&apos;ll get
            back to you as soon as possible.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition-all"
          >
            Back to Home
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-10 text-center">
            <h1
              className="text-3xl font-bold text-[var(--foreground)] mb-3"
              style={{ fontFamily: "var(--font-display-serif)" }}
            >
              Get in touch
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Questions, bug reports, feedback — we read every message.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-8 flex flex-col gap-5"
          >
            {/* Name + Email row */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                  Name <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                  Email <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="category" className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                Message <span className="text-[var(--accent)]">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us what's on your mind…"
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors resize-none"
              />
              <p className="text-xs text-[var(--muted)] text-right">
                {form.message.length}/5000
              </p>
            </div>

            {/* Error */}
            {status === "error" && (
              <p className="rounded-lg bg-red-900/20 border border-red-800/40 px-4 py-3 text-sm text-red-400">
                {errorMsg}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </button>

            <p className="text-xs text-[var(--muted)] text-center">
              We&apos;ll reply to your email — usually within 24 hours.
            </p>
          </form>
        </>
      )}
    </div>
  );
}

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-6">
        <Suspense fallback={<div className="mx-auto max-w-xl text-center text-[var(--muted)]">Loading…</div>}>
          <ContactForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
