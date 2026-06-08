import { createAdminClient } from "@/src/lib/supabase/admin";
import { NextResponse } from "next/server";
import { checkHttpRateLimit, strictLimiter } from "@/src/lib/httpRateLimit";

/**
 * GET /api/invite?token=<uuid>
 * Resolves an invite token to {email, name, familyName} for the login page.
 * Only works for pending members (user_id IS NULL).
 * Uses service-role client — no auth required (token IS the credential).
 *
 * Rate-limited (strictLimiter: 5/min per IP) to prevent brute-force
 * enumeration of invite tokens and email/name harvesting.
 */
export async function GET(request: Request) {
  const limited = await checkHttpRateLimit(request, strictLimiter);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  if (!token || token.length < 10) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // First: check if the token exists at all (without user_id filter, so we can distinguish reasons)
  const { data: anyMember } = await supabase
    .from("family_members")
    .select("contact_email, name, family_id, user_id, families(name)")
    .eq("invite_token", token)
    .single();

  if (!anyMember) {
    return NextResponse.json(
      { error: "This invite link isn't valid. Ask your family owner to send a new one.", reason: "not_found" },
      { status: 404 }
    );
  }

  if (anyMember.user_id !== null) {
    return NextResponse.json(
      { error: "You've already accepted this invite. Sign in to access your family.", reason: "already_used" },
      { status: 404 }
    );
  }

  const familyData = anyMember.families as unknown as { name: string } | null;

  // Email-less shareable invite (created via createShareableInvite): the owner
  // didn't have the recipient's email, so there's nothing to pre-fill. The
  // recipient supplies their own email, which is written onto this row at
  // claim time via /api/invite/claim-email. We can't know yet whether they
  // already have an account, so default hasAccount=false and let the claim
  // step resolve it.
  if (!anyMember.contact_email) {
    return NextResponse.json({
      email: null,
      name: anyMember.name,
      familyName: familyData?.name ?? "",
      hasAccount: false,
      emailless: true,
    });
  }

  // Check if any family_members row with this email already has a user_id (i.e. account exists)
  const { data: existingLink } = await supabase
    .from("family_members")
    .select("user_id")
    .eq("contact_email", anyMember.contact_email)
    .not("user_id", "is", null)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    email: anyMember.contact_email,
    name: anyMember.name,
    familyName: familyData?.name ?? "",
    hasAccount: !!existingLink?.user_id,
  });
}
