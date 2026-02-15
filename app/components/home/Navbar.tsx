"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <NestIcon className="h-8 w-8 text-[var(--primary)]" />
          <span className="text-lg font-[var(--font-display-serif)] text-[var(--foreground)]" style={{ fontFamily: "var(--font-display-serif)" }}>
            Our Family Nest
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            Features
          </Link>
          <Link
            href="#story"
            className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            Our Story
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            Pricing
          </Link>
          <Link
            href="/login?mode=signup"
            className="rounded-full bg-[var(--primary)] px-6 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
          >
            Start Your Family Nest
          </Link>
        </div>

        <button
          className="md:hidden text-[var(--foreground)]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)] px-6 pb-6 pt-4">
          <div className="flex flex-col gap-4">
            <Link
              href="#features"
              className="text-sm text-[var(--muted)]"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#story"
              className="text-sm text-[var(--muted)]"
              onClick={() => setMobileOpen(false)}
            >
              Our Story
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-[var(--muted)]"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-full bg-[var(--primary)] px-6 py-3 text-center text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
              onClick={() => setMobileOpen(false)}
            >
              Start Your Family Nest
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function NestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
      <path
        d="M10 20c0-3.3 2.7-6 6-6s6 2.7 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="13" cy="14" r="1.5" fill="currentColor" />
      <circle cx="19" cy="14" r="1.5" fill="currentColor" />
      <path
        d="M8 22c1-4 4.5-7 8-7s7 3 8 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />
    </svg>
  );
}
