import Link from "next/link";
import { LogoMark } from "@/app/components/LogoMark";

export function Footer() {
  return (
    <footer className="py-12 bg-[var(--surface)]" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-1 md:items-start">
            <div className="flex items-center gap-2">
              <LogoMark size={24} />
              <span
                style={{
                  fontFamily: "var(--font-display-serif)",
                  color: "var(--foreground)",
                }}
              >
                Family Nest
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Private. Permanent. Yours.
            </p>
          </div>

          <nav
            className="flex flex-wrap items-center justify-center gap-6"
            aria-label="Footer navigation"
          >
            <Link
              href="#pricing"
              className="text-sm transition-colors hover:opacity-75"
              style={{ color: "var(--muted)" }}
            >
              Pricing
            </Link>
            <Link
              href="/terms"
              className="text-sm transition-colors hover:opacity-75"
              style={{ color: "var(--muted)" }}
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm transition-colors hover:opacity-75"
              style={{ color: "var(--muted)" }}
            >
              Privacy
            </Link>
            <Link
              href="/contact"
              className="text-sm transition-colors hover:opacity-75"
              style={{ color: "var(--muted)" }}
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="text-sm transition-colors hover:opacity-75"
              style={{ color: "var(--muted)" }}
            >
              Sign in
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-8 text-center" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            &copy; {new Date().getFullYear()} Family Nest. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

