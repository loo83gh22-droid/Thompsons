import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import {
  stripe,
  STRIPE_PRICES,
  STORAGE_ADDON_CONFIGS,
  type CheckoutPlan,
  type StorageAddonPlan,
} from "@/src/lib/stripe";
import { checkHttpRateLimit, strictLimiter } from "@/src/lib/httpRateLimit";

const VALID_PLANS: CheckoutPlan[] = [
  "annual",
  "legacy",
  "storage_25gb",
  "storage_75gb",
  "storage_150gb",
];

function isStorageAddon(plan: CheckoutPlan): plan is StorageAddonPlan {
  return plan.startsWith("storage_");
}

export async function POST(request: Request) {
  const limited = await checkHttpRateLimit(request, strictLimiter);
  if (limited) return limited;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const plan = body.plan as CheckoutPlan;

    if (!plan || !VALID_PLANS.includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = STRIPE_PRICES[plan];
    if (!priceId) {
      console.error(`[stripe-checkout] Price not configured for plan: ${plan}. Set STRIPE_PRICE_${plan.toUpperCase()} env var.`);
      return NextResponse.json(
        { error: "This plan is not available. Please contact support." },
        { status: 500 }
      );
    }

    // Get the user's active family
    const { data: member } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();

    const familyId = member?.family_id ?? "";

    // B2: Create-or-retrieve Stripe customer to avoid duplicates.
    // If the family already has a stripe_customer_id, reuse it; otherwise create a new one.
    let stripeCustomerId: string | undefined;
    if (familyId) {
      const { data: family } = await supabase
        .from("families")
        .select("stripe_customer_id")
        .eq("id", familyId)
        .single();

      if (family?.stripe_customer_id) {
        stripeCustomerId = family.stripe_customer_id;
      } else if (user.email) {
        // Create a new customer and persist the ID immediately
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { family_id: familyId, user_id: user.id },
        });
        stripeCustomerId = customer.id;
        await supabase
          .from("families")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", familyId);
      }
    }

    // Storage add-ons require an active paid plan
    if (isStorageAddon(plan)) {
      const { data: family } = await supabase
        .from("families")
        .select("plan_type")
        .eq("id", familyId)
        .single();

      if (!family || family.plan_type === "free") {
        return NextResponse.json(
          {
            error:
              "Storage add-ons require an active Full Nest or Legacy plan.",
            code: "upgrade_required",
          },
          { status: 402 }
        );
      }
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const isOneTime = plan === "legacy";
    const addonConfig = isStorageAddon(plan)
      ? STORAGE_ADDON_CONFIGS[plan]
      : null;

    // Shared metadata for all plan types
    const sharedMeta: Record<string, string> = {
      user_id: user.id,
      family_id: familyId,
      plan,
    };
    if (addonConfig) {
      sharedMeta.bytes_added = String(addonConfig.bytes);
      sharedMeta.label = addonConfig.label;
      sharedMeta.price_usd = String(addonConfig.priceUsd);
    }

    const session = await stripe.checkout.sessions.create({
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : { customer_email: user.email }),
      mode: isOneTime ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: sharedMeta,
      success_url: `${appUrl}/dashboard/settings?payment=success&plan=${plan}`,
      cancel_url: isStorageAddon(plan)
        ? `${appUrl}/dashboard/settings`
        : `${appUrl}/pricing?payment=cancelled`,
      ...(isOneTime
        ? { payment_intent_data: { metadata: sharedMeta } }
        : { subscription_data: { metadata: sharedMeta } }),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
