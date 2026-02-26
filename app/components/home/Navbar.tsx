"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoMark } from "@/app/components/LogoMark";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] transition-shadow duration-200${scrolled ? " shadow-md" : ""}`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark size={32} />
          <span className="text-lg font-semibold text-[var(--foreground)]" style={{ fontFamily: "var(--font-display-serif)" }}>
            Family Nest
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
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
            href="/contact"
            className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            Contact
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
          >
            Log In
          </Link>
          <Link
            href="/login?mode=signup"
            className="rounded-full bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:brightness-110 hover:shadow-lg"
          >
            Start Your Family Nest
          </Link>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/login?mode=signup"
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:brightness-110"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Start Free
          </Link>
          <button
            className="text-[var(--foreground)]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
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
              href="/contact"
              className="text-sm text-[var(--muted)]"
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--foreground)]"
              onClick={() => setMobileOpen(false)}
            >
              Log In
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-center text-sm font-semibold text-white shadow-md transition-all duration-200 hover:brightness-110 hover:shadow-lg"
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

