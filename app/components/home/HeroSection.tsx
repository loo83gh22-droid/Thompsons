import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text Content */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <p
                className="text-sm font-medium uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                For every generation, under one roof
              </p>
              <h1
                className="text-4xl leading-tight md:text-5xl lg:text-6xl"
                style={{
                  fontFamily: "var(--font-display-serif)",
                  color: "var(--foreground)",
                  textWrap: "balance",
                }}
              >
                Your whole family&apos;s favorite place on the internet
              </h1>
              <p
                className="max-w-lg text-lg leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                A private, beautiful space where grandparents, parents, aunts, uncles, teens,
                and kids all come together. Journals, photos, videos, voice memos, recipes,
                and so much more. You start it. Your whole family makes it theirs.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-base font-medium transition-colors hover:opacity-90"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                Start Your Family Nest
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Free forever &middot; No credit card needed
              </p>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl aspect-[4/3]" style={{ backgroundColor: "var(--secondary)" }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: "var(--primary)", opacity: 0.15 }}>
                    <svg className="h-10 w-10" style={{ color: "var(--primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium" style={{ color: "var(--foreground)", fontFamily: "var(--font-display-serif)" }}>
                    Your Family, Together
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                    Every generation in one place
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
