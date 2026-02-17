"use server";

import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { stripe, STRIPE_PRICES } from "@/src/lib/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const plan = body.plan as "annual" | "legacy";

    if (!plan || !["annual", "legacy"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = STRIPE_PRICES[plan];
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price not configured for ${plan} plan. Set STRIPE_PRICE_${plan.toUpperCase()} env var.` },
        { status: 500 }
      );
    }

    // Get family ID for metadata
    const { data: member } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const isRecurring = plan === "annual";

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: isRecurring ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        user_id: user.id,
        family_id: member?.family_id ?? "",
        plan,
      },
      success_url: `${appUrl}/dashboard/settings?payment=success&plan=${plan}`,
      cancel_url: `${appUrl}/pricing?payment=cancelled`,
      ...(isRecurring
        ? {
            subscription_data: {
              metadata: {
                user_id: user.id,
                family_id: member?.family_id ?? "",
                plan,
              },
            },
          }
        : {
            payment_intent_data: {
              metadata: {
                user_id: user.id,
                family_id: member?.family_id ?? "",
                plan,
              },
            },
          }),
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
