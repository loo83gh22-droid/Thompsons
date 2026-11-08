import Link from "next/link";
import { CLOSED_CONTACT_EMAIL } from "@/src/lib/serviceStatus";

/**
 * Shown in place of any flow that cannot run while outbound email is down
 * (see src/lib/serviceStatus.ts). Deliberately plain and first-person: the
 * point is to tell someone the truth and not waste their time, rather than
 * take an email address or a payment that cannot be honoured.
 *
 * No hooks, so this renders in both Server and Client Components.
 */
export function ServiceClosedNotice({
  title,
  children,
  showSignIn = true,
}: {
  title: string;
  children: React.ReactNode;
  showSignIn?: boolean;
}) {
  return (
    <div
      role="status"
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-6 text-center"
    >
      <p className="font-display text-lg font-semibold text-[var(--foreground)]">
        {title}
      </p>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--muted)]">
        {children}
      </div>
      <p className="mt-4 text-sm text-[var(--muted)]">
        Questions, or want a hand?{" "}
        <a
          href={`mailto:${CLOSED_CONTACT_EMAIL}`}
          className="text-[var(--accent)] hover:underline"
        >
          {CLOSED_CONTACT_EMAIL}
        </a>
      </p>
      {showSignIn ? (
        <Link
          href="/login"
          className="mt-5 inline-block rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
        >
          Sign in to your Nest
        </Link>
      ) : null}
    </div>
  );
}
