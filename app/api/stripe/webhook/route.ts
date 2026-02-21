import { NextResponse } from "next/server";
import { stripe } from "@/src/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { PLAN_LIMITS } from "@/src/lib/constants";
import type Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function activatePlan(
  familyId: string,
  plan: "annual" | "legacy",
  stripeCustomerId: string,
  stripeSubscriptionId?: string
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date().toISOString();
  const oneYearFromNow = new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000
  ).toISOString();

  await supabase
    .from("families")
    .update({
      plan_type: plan,
      plan_started_at: now,
      plan_expires_at: plan === "annual" ? oneYearFromNow : null,
      storage_limit_bytes: PLAN_LIMITS[plan].storageLimitBytes,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId ?? null,
    })
    .eq("id", familyId);
}

async function deactivatePlan(stripeSubscriptionId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find the family with this subscription
  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .single();

  if (!family) return;

  await supabase
    .from("families")
    .update({
      plan_type: "free",
      plan_expires_at: null,
      storage_limit_bytes: PLAN_LIMITS.free.storageLimitBytes,
      stripe_subscription_id: null,
    })
    .eq("id", family.id);
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── One-time payment completed (Legacy plan) ──
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const familyId = session.metadata?.family_id;
        const plan = session.metadata?.plan as "annual" | "legacy";

        if (familyId && plan === "legacy") {
          // If upgrading from Annual → Legacy, cancel the existing annual
          // subscription so the family isn't billed again at renewal.
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          const { data: family } = await supabase
            .from("families")
            .select("stripe_subscription_id")
            .eq("id", familyId)
            .single();

          if (family?.stripe_subscription_id) {
            try {
              await stripe.subscriptions.cancel(family.stripe_subscription_id);
            } catch (err) {
              // Log but don't block — Legacy plan must still activate
              console.warn("Could not cancel prior annual subscription:", err);
            }
          }

          await activatePlan(familyId, "legacy", session.customer as string);
        }
        break;
      }

      // ── Subscription activated or renewed ──
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        // In newer Stripe API, subscription is nested under parent
        const subId =
          (invoice as unknown as Record<string, unknown>).subscription as string | undefined
          ?? invoice.parent?.subscription_details?.subscription as string | undefined;
        if (!subId) break;

        const subscription = await stripe.subscriptions.retrieve(subId);
        const familyId = subscription.metadata?.family_id;
        const plan = subscription.metadata?.plan as "annual" | "legacy";

        if (familyId && plan === "annual") {
          await activatePlan(
            familyId,
            "annual",
            invoice.customer as string,
            subscription.id
          );
        }
        break;
      }

      // ── Subscription cancelled or expired ──
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await deactivatePlan(subscription.id);
        break;
      }

      // ── Payment failed (subscription renewal) ──
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(
          `Payment failed for customer ${invoice.customer}, invoice ${invoice.id}`
        );
        // Stripe will retry automatically. The subscription stays active
        // until Stripe exhausts retries, then fires customer.subscription.deleted.
        break;
      }

      default:
        // Unhandled event type — that's fine, just log it
        // Unhandled event type — ignored
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
