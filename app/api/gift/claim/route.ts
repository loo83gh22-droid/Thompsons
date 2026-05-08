/**
 * Gift Claim
 * ----------
 * Phase D of the gift purchase flow. Closes the loop. The recipient
 * arrives via the email link, sets a password, and this route:
 *
 *   1. Validates the token + password
 *   2. Looks up the pending_gifts row (must be status='pending')
 *   3. Branches on whether the recipient_email already has an account:
 *      - NEW USER: creates an auth user (email_confirm=true so they
 *        skip Supabase's confirmation email), creates a families row
 *        with plan_type='legacy', creates the family_members owner
 *        row.
 *      - EXISTING USER: requires the caller to be signed in as the
 *        recipient. Upgrades their owned family (or the one they pick
 *        if multiple) to Legacy.
 *   4. Marks the pending_gifts row as 'redeemed' with audit fields
 *   5. Sends the buyer the "[recipient] just opened your gift" email
 *
 * For the new-user path, the client (ClaimForm.tsx) calls
 * supabase.auth.signInWithPassword AFTER this route returns success,
 * which establishes the session cookie. The route itself doesn't set
 * cookies — keeping it cleanly separated from auth side effects.
 */

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/src/lib/supabase/server";
import { Resend } from "resend";
import { PLAN_LIMITS } from "@/src/lib/constants";
import { buildGiftBuyerRedeemedEmail } from "@/app/api/emails/templates/gift-buyer-redeemed";
import { checkHttpRateLimit, strictLimiter } from "@/src/lib/httpRateLimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || "Family Nest <hello@send.familynest.io>";

const MIN_PASSWORD_LENGTH = 8;
const TOKEN_REGEX = /^[a-f0-9]{64}$/i;

type ClaimRequestBody = {
  token?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  const limited = await checkHttpRateLimit(request, strictLimiter);
  if (limited) return limited;

  let body: ClaimRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!TOKEN_REGEX.test(token)) {
    return NextResponse.json({ error: "Invalid redemption link." }, { status: 400 });
  }

  // Service-role client — used for all the DB writes that must bypass RLS
  // (auth user creation, family insert with plan_type=legacy, etc).
  const admin = createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Look up the gift
  const { data: gift, error: giftErr } = await admin
    .from("pending_gifts")
    .select(
      "id, redemption_token, buyer_email, buyer_name, recipient_email, recipient_name, plan, status"
    )
    .eq("redemption_token", token)
    .single();

  if (giftErr || !gift) {
    return NextResponse.json({ error: "Gift not found." }, { status: 404 });
  }
  if (gift.status === "redeemed") {
    return NextResponse.json(
      { error: "This gift has already been claimed." },
      { status: 409 }
    );
  }
  if (gift.status !== "pending") {
    return NextResponse.json(
      { error: "This gift is no longer available." },
      { status: 410 }
    );
  }

  // 2. Branch on whether an account already exists for this email
  const recipientEmailLower = gift.recipient_email.toLowerCase();
  const { data: existingMember } = await admin
    .from("family_members")
    .select("user_id, family_id, role")
    .eq("contact_email", recipientEmailLower)
    .not("user_id", "is", null)
    .maybeSingle();

  let resultFamilyId: string;
  let resultUserId: string;

  if (existingMember) {
    // ── EXISTING USER PATH ──────────────────────────────────────────
    // Require the caller to be signed in as the recipient. We don't
    // accept the password here — they sign in normally.
    const userClient = await createServerClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user || user.email?.toLowerCase() !== recipientEmailLower) {
      return NextResponse.json(
        {
          error: "existing_user_signin_required",
          message: `An account exists for ${gift.recipient_email}. Sign in to claim your gift.`,
        },
        { status: 401 }
      );
    }

    // Find the family they own. If multiple, pick the most-recent one
    // for now (multi-family picker is a future enhancement — flagged
    // as #4 in the design doc, not v1).
    const { data: ownedFamily } = await admin
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!ownedFamily?.family_id) {
      return NextResponse.json(
        {
          error:
            "We couldn't find a family you own to apply this gift to. Please contact support.",
        },
        { status: 400 }
      );
    }

    resultFamilyId = ownedFamily.family_id;
    resultUserId = user.id;

    // Upgrade the family to Legacy
    const { error: upgradeErr } = await admin
      .from("families")
      .update({
        plan_type: "legacy",
        plan_started_at: new Date().toISOString(),
        plan_expires_at: null,
        storage_limit_bytes: PLAN_LIMITS.legacy.storageLimitBytes,
      })
      .eq("id", resultFamilyId);

    if (upgradeErr) {
      console.error("[gift-claim] Family upgrade failed:", upgradeErr);
      return NextResponse.json(
        { error: "Couldn't apply your gift. Please contact support." },
        { status: 500 }
      );
    }
  } else {
    // ── NEW USER PATH ──────────────────────────────────────────────
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // Create the auth user with email already confirmed (the gift email
    // IS the confirmation — we know they own the email because they
    // received and clicked our token).
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: gift.recipient_email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: gift.recipient_name,
        family_name: `${gift.recipient_name.split(" ")[0] || gift.recipient_name}'s`,
      },
    });

    if (createErr || !created.user) {
      // Race condition: an account got created between our earlier
      // check and now. Tell the client to use the existing-user path.
      if (createErr?.message?.toLowerCase().includes("already")) {
        return NextResponse.json(
          {
            error: "existing_user_signin_required",
            message: `An account exists for ${gift.recipient_email}. Sign in to claim your gift.`,
          },
          { status: 401 }
        );
      }
      console.error("[gift-claim] auth.admin.createUser failed:", createErr);
      return NextResponse.json(
        { error: "Couldn't create your account. Please try again or contact support." },
        { status: 500 }
      );
    }

    resultUserId = created.user.id;

    // Create the family with Legacy plan
    const familyName = `${gift.recipient_name.split(" ")[0] || gift.recipient_name}'s`;
    const { data: newFamily, error: famErr } = await admin
      .from("families")
      .insert({
        name: familyName,
        plan_type: "legacy",
        plan_started_at: new Date().toISOString(),
        plan_expires_at: null,
        storage_limit_bytes: PLAN_LIMITS.legacy.storageLimitBytes,
      })
      .select("id")
      .single();

    if (famErr || !newFamily) {
      console.error("[gift-claim] Family insert failed:", famErr);
      // Best-effort cleanup: the auth user exists but with no family.
      // Recipient can sign in and contact support.
      return NextResponse.json(
        { error: "Account created but family setup failed. Please contact support." },
        { status: 500 }
      );
    }

    resultFamilyId = newFamily.id;

    // Create the owner family_member row
    const { error: memberErr } = await admin.from("family_members").insert({
      family_id: resultFamilyId,
      user_id: resultUserId,
      name: gift.recipient_name,
      contact_email: recipientEmailLower,
      role: "owner",
    });

    if (memberErr) {
      console.error("[gift-claim] Owner member insert failed:", memberErr);
      return NextResponse.json(
        { error: "Account setup partially failed. Please contact support." },
        { status: 500 }
      );
    }
  }

  // 3. Mark the gift as redeemed (single update — atomic)
  const { error: redeemErr } = await admin
    .from("pending_gifts")
    .update({
      status: "redeemed",
      redeemed_at: new Date().toISOString(),
      redeemed_by_user_id: resultUserId,
      redeemed_into_family_id: resultFamilyId,
    })
    .eq("id", gift.id)
    .eq("status", "pending"); // guard against double-redeem race

  if (redeemErr) {
    // The gift is technically applied but the audit record didn't
    // update. Log loudly but don't fail the user flow.
    console.error("[gift-claim] Failed to mark pending_gifts redeemed:", redeemErr);
  }

  // 4. Send the buyer's "[recipient] opened your gift" email
  if (resend) {
    try {
      const { subject, html } = buildGiftBuyerRedeemedEmail({
        buyerName: gift.buyer_name,
        recipientName: gift.recipient_name,
      });
      await resend.emails.send({
        from: fromEmail,
        to: gift.buyer_email,
        subject,
        html,
      });
    } catch (err) {
      // Don't fail the redemption on email failure
      console.error("[gift-claim] Buyer-redeemed email failed:", err);
    }
  }

  return NextResponse.json({
    success: true,
    isExistingUser: !!existingMember,
    familyId: resultFamilyId,
  });
}
