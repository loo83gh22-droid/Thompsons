import { createAdminClient } from "@/src/lib/supabase/admin";
import { NextResponse } from "next/server";
import { checkHttpRateLimit, strictLimiter } from "@/src/lib/httpRateLimit";

/**
 * POST /api/invite/claim-email  { token, email }
 *
 * Second half of the email-less "shareable invite link" flow. The owner
 * created a pending family_member with a token but no email (see
 * createShareableInvite). The recipient opens the link and enters their own
 * email; this route writes that email onto the member row so the EXISTING
 * email-keyed linking (auth callback / link-invite) can attach them after
 * signup or sign-in. No changes to the signup/confirmation path required.
 *
 * Security:
 *  - Uses the service-role client — the token is the credential (same trust
 *    model as the emailed invite link).
 *  - Rate-limited (strictLimiter, 5/min/IP) against token brute-force.
 *  - The UPDATE is guarded to user_id IS NULL AND contact_email IS NULL, so
 *    it can ONLY populate a still-unclaimed, still-email-less invite. It can
 *    never change an emailed invite's address or hijack a claimed member.
 *  - Returns hasAccount so the client knows whether to sign in vs sign up.
 */
export async function POST(request: Request) {
  const limited = await checkHttpRateLimit(request, strictLimiter);
  if (limited) return limited;

  let body: { token?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = body.token?.trim();
  const email = body.email?.trim().toLowerCase();

  if (!token || token.length < 10) {
    return NextResponse.json({ error: "This invite link isn't valid." }, { status: 400 });
  }
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: updated, error } = await supabase
    .from("family_members")
    .update({ contact_email: email })
    .eq("invite_token", token)
    .is("user_id", null)
    .is("contact_email", null)
    .select("id, family_id")
    .maybeSingle();

  if (error) {
    console.error("[invite/claim-email] update error:", error);
    return NextResponse.json({ error: "Couldn't process this invite. Try again." }, { status: 500 });
  }
  if (!updated) {
    // Token doesn't exist, was already claimed, or already had an email.
    return NextResponse.json(
      { error: "This invite link isn't valid anymore. Ask your family for a fresh one.", reason: "not_claimable" },
      { status: 409 }
    );
  }

  // Does an account already exist for this email? Tells the client whether the
  // recipient should sign in (existing account) or sign up (new account).
  const { data: existing } = await supabase
    .from("family_members")
    .select("user_id")
    .eq("contact_email", email)
    .not("user_id", "is", null)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ ok: true, hasAccount: !!existing?.user_id });
}
