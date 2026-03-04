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
 * STRIPE_PRICE_ANNUAL      -> $79/year recurring price
 * STRIPE_PRICE_LEGACY      -> $349 one-time price
 * STRIPE_PRICE_STORAGE_25  -> $9/year recurring (+25 GB add-on)
 * STRIPE_PRICE_STORAGE_75  -> $24/year recurring (+75 GB add-on)
 * STRIPE_PRICE_STORAGE_150 -> $49/year recurring (+150 GB add-on)
 */
export const STRIPE_PRICES = {
  annual:       process.env.STRIPE_PRICE_ANNUAL       ?? "",
  legacy:       process.env.STRIPE_PRICE_LEGACY       ?? "",
  storage_25gb: process.env.STRIPE_PRICE_STORAGE_25   ?? "",
  storage_75gb: process.env.STRIPE_PRICE_STORAGE_75   ?? "",
  storage_150gb: process.env.STRIPE_PRICE_STORAGE_150 ?? "",
} as const;

/** Config for each storage add-on tier (bytes, display label, price). */
export const STORAGE_ADDON_CONFIGS = {
  storage_25gb: {
    bytes: 25 * 1024 * 1024 * 1024,   // 26,843,545,600
    label: "+25 GB",
    priceUsd: 9,
  },
  storage_75gb: {
    bytes: 75 * 1024 * 1024 * 1024,   // 80,530,636,800
    label: "+75 GB",
    priceUsd: 24,
  },
  storage_150gb: {
    bytes: 150 * 1024 * 1024 * 1024,  // 161,061,273,600
    label: "+150 GB",
    priceUsd: 49,
  },
} as const;

export type StorageAddonPlan = keyof typeof STORAGE_ADDON_CONFIGS;
export type CheckoutPlan = "annual" | "legacy" | StorageAddonPlan;
