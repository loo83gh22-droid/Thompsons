import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

/** Convenience re-export for routes that use `stripe.xyz` pattern */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Stripe Price IDs — set these in your Vercel environment variables.
 * Create products + prices in the Stripe Dashboard first, then paste the IDs.
 *
 * STRIPE_PRICE_ANNUAL  -> $49/year recurring price
 * STRIPE_PRICE_LEGACY  -> $349 one-time price
 */
export const STRIPE_PRICES = {
  annual: process.env.STRIPE_PRICE_ANNUAL ?? "",
  legacy: process.env.STRIPE_PRICE_LEGACY ?? "",
} as const;
