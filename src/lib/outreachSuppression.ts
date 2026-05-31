/**
 * Outreach suppression list.
 *
 * Emails listed here are EXCLUDED from any non-transactional outreach
 * sent by Family Nest:
 *   - Lifecycle drip campaigns (Day 0 / 1 / 3 / 5 / 14 / 30)
 *   - Weekly digest
 *   - Future seasonal/promo blasts (Father's Day, etc.)
 *
 * Transactional emails — confirmation, invite acceptance, gift
 * delivery, password reset — still fire as normal. Suppression only
 * applies to messages we initiate. Anything the user explicitly
 * triggered or expects (signed up, bought a gift, requested a reset)
 * is delivered regardless.
 *
 * Operational use:
 *   - Add an email to SUPPRESSED_OUTREACH_EMAILS to silence them
 *   - Comments next to each entry explain why (audit trail in source)
 *   - Email comparison is case-insensitive
 *
 * If this list grows past ~10 entries, migrate to a DB table with an
 * admin UI. Until then a static list is the simplest possible thing
 * that works.
 */

const SUPPRESSED_OUTREACH_EMAILS: ReadonlyArray<string> = [
  // ──────────────────────────────────────────────────────────────────
  // djlesieur@gmail.com — suppressed 2026-05-28. Signed up under
  // "The Shark Beight Family" on 2026-05-11. Rob's read is that the
  // signup was for competitive research (Daniel runs familyjournal.ai,
  // a directly adjacent product) rather than genuine product use.
  // No content was created on the account. We're keeping the row
  // (not deleting) but excluding from all initiated outreach. See
  // `docs/SESSION_HANDOFF.md` for the full decision context.
  "djlesieur@gmail.com",
] as const;

/**
 * Returns true if the given email address should be skipped for
 * any non-transactional outreach.
 *
 * Case-insensitive, trims whitespace, safe for null/undefined.
 */
export function isOutreachSuppressed(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return SUPPRESSED_OUTREACH_EMAILS.some(
    (suppressed) => suppressed.trim().toLowerCase() === normalized
  );
}
