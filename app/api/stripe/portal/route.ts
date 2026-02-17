import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { stripe } from "@/src/lib/stripe";
import { getActiveFamilyId } from "@/src/lib/family";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    const { data: family } = await supabase
      .from("families")
      .select("stripe_customer_id")
      .eq("id", activeFamilyId)
      .single();

    if (!family?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. You may be on the free plan." },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const session = await stripe.billingPortal.sessions.create({
      customer: family.stripe_customer_id,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
