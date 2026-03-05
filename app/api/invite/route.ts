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

  const { data: member } = await supabase
    .from("family_members")
    .select("contact_email, name, family_id, families(name)")
    .eq("invite_token", token)
    .is("user_id", null)
    .single();

  if (!member || !member.contact_email) {
    return NextResponse.json({ error: "Token not found or already used" }, { status: 404 });
  }

  const familyData = member.families as unknown as { name: string } | null;

  return NextResponse.json({
    email: member.contact_email,
    name: member.name,
    familyName: familyData?.name ?? "",
  });
}
