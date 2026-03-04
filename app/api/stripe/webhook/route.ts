import { NextResponse } from "next/server";
import { stripe } from "@/src/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { PLAN_LIMITS } from "@/src/lib/constants";
import type Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ── Plan helpers ─────────────────────────────────────────────────────────────

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

// ── Storage add-on helpers ────────────────────────────────────────────────────

async function activateStorageAddon(
  familyId: string,
  stripeSubscriptionId: string,
  bytesAdded: number,
  label: string,
  priceUsd: number
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check if this add-on already exists (invoice.paid fires on renewal too)
  const { data: existing } = await supabase
    .from("storage_addons")
    .select("id, status")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .single();

  if (!existing) {
    // New purchase: insert row and bump storage limit
    await supabase.from("storage_addons").insert({
      family_id: familyId,
      stripe_subscription_id: stripeSubscriptionId,
      bytes_added: bytesAdded,
      label,
      price_per_year_usd: priceUsd,
      status: "active",
    });

    await supabase.rpc("increment_storage_limit", {
      fid: familyId,
      bytes_to_add: bytesAdded,
    });
  } else if (existing.status === "cancelled") {
    // Re-activated (edge case): restore status and re-add bytes
    await supabase
      .from("storage_addons")
      .update({ status: "active", cancelled_at: null })
      .eq("stripe_subscription_id", stripeSubscriptionId);

    await supabase.rpc("increment_storage_limit", {
      fid: familyId,
      bytes_to_add: bytesAdded,
    });
  }
  // If already active (renewal): no-op — storage limit unchanged
}

async function deactivateStorageAddon(stripeSubscriptionId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: addon } = await supabase
    .from("storage_addons")
    .select("family_id, bytes_added, status")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .single();

  if (!addon || addon.status === "cancelled") return;

  await supabase
    .from("storage_addons")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", stripeSubscriptionId);

  await supabase.rpc("decrement_storage_limit", {
    fid: addon.family_id,
    bytes_to_subtract: addon.bytes_added,
  });
}

// ── Webhook handler ───────────────────────────────────────────────────────────

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
      // ── One-time payment completed (Legacy plan only) ──────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const familyId = session.metadata?.family_id;
        const plan = session.metadata?.plan;

        if (familyId && plan === "legacy") {
          // Cancel any existing annual subscription before activating Legacy
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
              console.warn("Could not cancel prior annual subscription:", err);
            }
          }

          await activatePlan(familyId, "legacy", session.customer as string);
        }
        break;
      }

      // ── Subscription activated or renewed (Annual + Storage add-ons) ───────
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          (invoice as unknown as Record<string, unknown>).subscription as
            | string
            | undefined ??
          invoice.parent?.subscription_details?.subscription as
            | string
            | undefined;
        if (!subId) break;

        const subscription = await stripe.subscriptions.retrieve(subId);
        const meta = subscription.metadata ?? {};
        const familyId = meta.family_id;
        const plan = meta.plan;

        if (!familyId || !plan) break;

        if (plan === "annual") {
          await activatePlan(
            familyId,
            "annual",
            invoice.customer as string,
            subscription.id
          );
        } else if (
          plan === "storage_25gb" ||
          plan === "storage_75gb" ||
          plan === "storage_150gb"
        ) {
          const bytesAdded = Number(meta.bytes_added);
          const label = meta.label ?? plan;
          const priceUsd = Number(meta.price_usd ?? 0);

          if (bytesAdded > 0) {
            await activateStorageAddon(
              familyId,
              subscription.id,
              bytesAdded,
              label,
              priceUsd
            );
          }
        }
        break;
      }

      // ── Subscription cancelled or expired ──────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subId = subscription.id;

        // Check if it's a storage add-on first, then fall back to plan
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: addon } = await supabase
          .from("storage_addons")
          .select("id")
          .eq("stripe_subscription_id", subId)
          .single();

        if (addon) {
          await deactivateStorageAddon(subId);
        } else {
          await deactivatePlan(subId);
        }
        break;
      }

      // ── Payment failed (subscription renewal) ──────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(
          `Payment failed for customer ${invoice.customer}, invoice ${invoice.id}`
        );
        // Stripe retries automatically. Subscription stays active until
        // retries are exhausted, then fires customer.subscription.deleted.
        break;
      }

      default:
        // Unhandled event type — ignored
        break;
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
