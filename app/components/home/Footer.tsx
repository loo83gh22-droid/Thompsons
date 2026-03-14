import Link from "next/link";
import { LogoMark } from "@/app/components/LogoMark";

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="py-12 bg-[var(--surface)]" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-3 md:items-start">
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
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/familynest.io"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:opacity-75"
                style={{ color: "var(--muted)" }}
                aria-label="Follow us on Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://www.facebook.com/familynest.io"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:opacity-75"
                style={{ color: "var(--muted)" }}
                aria-label="Follow us on Facebook"
              >
                <FacebookIcon />
              </a>
            </div>
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

