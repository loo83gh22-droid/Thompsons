import { NextResponse } from "next/server";
import { stripe } from "@/src/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { PLAN_LIMITS } from "@/src/lib/constants";
import { Resend } from "resend";
import { esc, emailWrapper, card, ctaButton, appUrl } from "@/app/api/emails/templates/shared";
import type Stripe from "stripe";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || "Family Nest <hello@send.familynest.io>";

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

  // B3: Cross-check that the customer ID matches the one stored for this family.
  // This prevents a metadata-mismatch from activating the wrong family's plan.
  const { data: existingFamily } = await supabase
    .from("families")
    .select("stripe_customer_id")
    .eq("id", familyId)
    .single();

  if (
    existingFamily?.stripe_customer_id &&
    existingFamily.stripe_customer_id !== stripeCustomerId
  ) {
    console.error(
      `activatePlan: customer ID mismatch for family ${familyId}. ` +
        `Expected ${existingFamily.stripe_customer_id}, got ${stripeCustomerId}. Aborting.`
    );
    return;
  }

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
    .select("family_id, bytes_added, status, label")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .single();

  if (!addon || addon.status === "cancelled" || addon.status === "cancelling") return;

  // Start 30-day grace period instead of immediately removing storage
  const graceUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await supabase
    .from("storage_addons")
    .update({
      status: "cancelling",
      cancelled_at: new Date().toISOString(),
      grace_until: graceUntil,
    })
    .eq("stripe_subscription_id", stripeSubscriptionId);

  // Get family name + owner/adult emails to notify
  const { data: family } = await supabase
    .from("families")
    .select("name, storage_used_bytes, storage_limit_bytes")
    .eq("id", addon.family_id)
    .single();

  const { data: members } = await supabase
    .from("family_members")
    .select("contact_email, role")
    .eq("family_id", addon.family_id)
    .in("role", ["owner", "adult"])
    .not("contact_email", "is", null);

  const emails = (members ?? [])
    .map((m) => m.contact_email as string)
    .filter(Boolean);

  if (resend && emails.length > 0 && family) {
    const newLimitBytes = family.storage_limit_bytes - addon.bytes_added;
    const newLimitGb = (newLimitBytes / (1024 ** 3)).toFixed(0);
    const usedGb = (family.storage_used_bytes / (1024 ** 3)).toFixed(1);
    const graceDate = new Date(graceUntil).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

    const isOverLimit = family.storage_used_bytes > newLimitBytes;

    // Send individually — avoids exposing the full recipient list to Resend
    // in a single call (which would reveal family member email addresses).
    for (const to of emails) {
      await resend.emails.send({
        from: fromEmail,
        to,
        subject: `Your ${addon.label} storage add-on has been cancelled`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2 style="color:#1a1a1a">Storage add-on cancelled</h2>
            <p>Your <strong>${addon.label}</strong> storage add-on for <strong>${family.name}</strong> has been cancelled.</p>
            ${isOverLimit ? `
            <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin:20px 0">
              <strong>⚠️ Action required by ${graceDate}</strong>
              <p style="margin:8px 0 0">You are currently using <strong>${usedGb} GB</strong> but your new limit will be <strong>${newLimitGb} GB</strong>.
              Please reduce your storage before ${graceDate}.</p>
              <p style="margin:8px 0 0">After that date, Family Nest will remove your largest media files (photos and videos) to bring your account within its limit.
              <strong>Text memories (journal entries, stories, recipes) will never be deleted.</strong></p>
            </div>
            <p><a href="https://www.familynest.io/dashboard/settings" style="background:#e53e3e;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Manage my storage</a></p>
            ` : `
            <p style="color:#38a169">✅ Your current usage (${usedGb} GB) is within your new limit of ${newLimitGb} GB. No action needed.</p>
            `}
            <p style="color:#666;font-size:13px;margin-top:24px">The Family Nest Team</p>
          </div>
        `,
      });
    }
  }
}

// ── Upgrade confirmation email ────────────────────────────────────────────────

async function sendUpgradeEmail(familyId: string, plan: "annual" | "legacy") {
  if (!resend) return;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: owner } = await supabase
    .from("family_members")
    .select("contact_email, name, families(name)")
    .eq("family_id", familyId)
    .eq("role", "owner")
    .not("contact_email", "is", null)
    .single();

  if (!owner?.contact_email) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const familyRecord = owner.families as any;
  const familyName = esc(familyRecord?.name ?? "your family");
  const ownerName = esc(owner.name ?? "there");
  const planLabel = plan === "annual" ? "Annual Plan" : "Lifetime Plan";

  const benefits =
    plan === "annual"
      ? ["Unlimited photos & videos", "100 GB storage", "All features unlocked", "Priority support"]
      : ["Everything in Annual, forever", "Lifetime access — pay once", "150 GB storage", "VIP founder status"];

  const benefitList = benefits
    .map((b) => `<li style="margin:6px 0;color:#94a3b8;font-size:14px;list-style:none;padding-left:0;">✓ &nbsp;${esc(b)}</li>`)
    .join("");

  const html = emailWrapper(card(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f0f2f8;">Welcome to the ${esc(planLabel)}! 🎉</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#94a3b8;line-height:1.6;">
      Hi ${ownerName} — thank you! <strong style="color:#D4A843;">${familyName}</strong>'s Nest has been upgraded.
    </p>
    <ul style="margin:0 0 24px;padding:0;">${benefitList}</ul>
    ${ctaButton("Open your Nest →", `${appUrl}/dashboard`)}
  `));

  await resend.emails.send({
    from: fromEmail,
    to: owner.contact_email,
    subject: `You're on the ${planLabel} — welcome! 🎉`,
    html,
  }).catch((err) => console.error("[stripe-webhook] upgrade email error:", err));
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
          await sendUpgradeEmail(familyId, "legacy");
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
          // Only email on first purchase, not renewals
          if ((invoice as unknown as Record<string, unknown>).billing_reason === "subscription_create") {
            await sendUpgradeEmail(familyId, "annual");
          }
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

      // ── Subscription updated (plan change / trial end / quantity change) ──
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const meta = subscription.metadata ?? {};
        const familyId = meta.family_id;
        const plan = meta.plan;

        if (!familyId || !plan) break;

        if (plan === "annual" && subscription.status === "active") {
          await activatePlan(
            familyId,
            "annual",
            subscription.customer as string,
            subscription.id
          );
        } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
          // Treat a degraded status as cancellation — deactivatePlan will handle it
          await deactivatePlan(subscription.id);
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
        // Unhandled event type — log so we notice new Stripe event types
        console.warn(`[stripe-webhook] Unhandled event type: ${event.type}`);
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
