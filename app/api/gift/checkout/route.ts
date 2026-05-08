/**
 * Gift Purchase Checkout
 * ----------------------
 * Creates a Stripe Checkout session for a gift purchase. Unlike the
 * regular /api/stripe/checkout route, this one does NOT require the
 * buyer to be authenticated — they pay as a guest, and the recipient
 * sets up their own account at redemption time.
 *
 * Flow:
 *   1. Buyer fills /gift/buy form
 *   2. POST here with buyer + recipient details + optional gift message
 *   3. We pick the right Stripe price (founding vs standard Legacy)
 *      based on current date (Mother's Day 2026 cutoff)
 *   4. Create checkout session with gift metadata
 *   5. Return session URL; client redirects buyer to Stripe
 *   6. On payment success, the webhook (Phase C) reads the gift metadata,
 *      inserts the pending_gifts row, and emails buyer + recipient
 *
 * The webhook is what closes the loop. This route just opens it.
 */

import { NextResponse } from "next/server";
import { stripe, STRIPE_PRICES } from "@/src/lib/stripe";
import { checkHttpRateLimit, strictLimiter } from "@/src/lib/httpRateLimit";

// Mother's Day 2026 — same cutoff used by FoundingRateCountdown.
// After this date, gifts charge the standard $349 Legacy price.
const FOUNDING_RATE_END = new Date("2026-05-10T00:00:00");

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 500;

function isValidEmail(email: string): boolean {
  // Pragmatic email check — Stripe will do the authoritative validation.
  // We just want to reject obvious garbage before it hits Stripe.
  if (!email || email.length > MAX_EMAIL_LENGTH) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function trimAndCap(input: unknown, max: number): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, max);
}

export async function POST(request: Request) {
  const limited = await checkHttpRateLimit(request, strictLimiter);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const buyerName = trimAndCap(body.buyerName, MAX_NAME_LENGTH);
  const buyerEmail = trimAndCap(body.buyerEmail, MAX_EMAIL_LENGTH);
  const recipientName = trimAndCap(body.recipientName, MAX_NAME_LENGTH);
  const recipientEmail = trimAndCap(body.recipientEmail, MAX_EMAIL_LENGTH);
  const giftMessage = trimAndCap(body.giftMessage, MAX_MESSAGE_LENGTH);

  // Required-field validation
  if (!buyerName || !recipientName) {
    return NextResponse.json(
      { error: "Both buyer name and recipient name are required." },
      { status: 400 }
    );
  }
  if (!isValidEmail(buyerEmail) || !isValidEmail(recipientEmail)) {
    return NextResponse.json(
      { error: "Please provide valid email addresses for both buyer and recipient." },
      { status: 400 }
    );
  }

  // Pick the active Legacy price based on date.
  const isFoundingActive = Date.now() < FOUNDING_RATE_END.getTime();
  const planSlug = isFoundingActive ? "legacy_founding" : "legacy";
  const priceId = STRIPE_PRICES[planSlug];

  if (!priceId) {
    console.error(
      `[gift-checkout] STRIPE_PRICE_${planSlug.toUpperCase()} env var not configured.`
    );
    return NextResponse.json(
      { error: "Gift purchases are not available right now. Please contact support." },
      { status: 500 }
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  // Gift metadata — read by the Stripe webhook to insert the
  // pending_gifts row and trigger the recipient + buyer emails.
  const giftMeta: Record<string, string> = {
    gift: "true",
    plan: planSlug,
    buyer_email: buyerEmail,
    buyer_name: buyerName,
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    gift_message: giftMessage, // empty string if omitted
  };

  try {
    // Pass recipient's first name to the success page so we can
    // personalize the confirmation without exposing the full email.
    const recipientFirstName = recipientName.split(" ")[0] || recipientName;

    const session = await stripe.checkout.sessions.create({
      mode: "payment", // Legacy is one-time
      customer_email: buyerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: giftMeta,
      payment_intent_data: { metadata: giftMeta },
      success_url: `${appUrl}/gift/sent?recipient=${encodeURIComponent(recipientFirstName)}`,
      cancel_url: `${appUrl}/gift/buy?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[gift-checkout] Stripe session creation failed:", error);
    return NextResponse.json(
      { error: "Failed to start checkout. Please try again or contact support." },
      { status: 500 }
    );
  }
}
