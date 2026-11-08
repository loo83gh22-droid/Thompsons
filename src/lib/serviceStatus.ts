/**
 * Outbound email delivery status.
 *
 * Every transactional email in this app sends via Resend from
 * `hello@send.familynest.io`. That sending domain was removed from Resend in
 * July 2026, so Resend rejects the send and nothing is delivered. The flows
 * below all depend on an email arriving, and each of them fails SILENTLY:
 *
 *   - /api/auth/signup creates the auth.users row, fails to send the
 *     confirmation, and still returns `success: true`. The browser shows
 *     "check your email" and no email comes. Because that branch returns
 *     early, the admin notification never fires either — which is why this
 *     went unnoticed. Between late May and November 2026 it stranded 14
 *     accounts, none of which could ever sign in.
 *   - /api/auth/resend-confirmation backs the "Resend confirmation email"
 *     button, which reports "Sent! Check your inbox" off the HTTP status
 *     alone. People retried and got a green checkmark and nothing.
 *   - /api/gift/checkout takes a real $249-349 Stripe payment and the
 *     webhook then emails the recipient their redemption link. No email
 *     means money taken and nothing delivered. This is the one that matters.
 *   - /api/auth/reset-password locks out any existing user who forgets
 *     their password.
 *
 * Closing these honestly is better than letting them accept an email address
 * or a payment that cannot be honoured.
 *
 * TO REOPEN:
 *   1. Verify a Family Nest sending domain in Resend (the free-tier slot is
 *      currently used by another business, so this needs a paid plan or a
 *      different provider).
 *   2. Set RESEND_FROM_EMAIL to an address on that verified domain.
 *   3. Run one real signup end to end and confirm the email arrives.
 *   4. Flip EMAIL_DELIVERY_WORKING to true.
 *
 * Signing in is unaffected and stays open — it needs no email.
 */
export const EMAIL_DELIVERY_WORKING = false;

/** New account creation. Needs a confirmation email to be usable. */
export const SIGNUPS_OPEN = EMAIL_DELIVERY_WORKING;

/** Guest gift purchases. Needs a redemption email, and takes real money. */
export const GIFT_PURCHASES_OPEN = EMAIL_DELIVERY_WORKING;

/** Password resets. Needs a reset link email. */
export const PASSWORD_RESET_OPEN = EMAIL_DELIVERY_WORKING;

/** Shown to anyone who reaches a closed flow. */
export const CLOSED_CONTACT_EMAIL = "hello@familynest.io";
