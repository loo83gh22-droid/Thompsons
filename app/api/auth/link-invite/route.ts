import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/link-invite
 * Links the currently signed-in user to any pending family_members rows
 * that match their email (user_id IS NULL). Called by the invite flow when
 * an existing user accepts an invite by signing in (rather than signing up).
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data: linked, error } = await adminClient
    .from("family_members")
    .update({ user_id: user.id })
    .eq("contact_email", user.email)
    .is("user_id", null)
    .select("id, name, family_id");

  if (error) {
    console.error("[link-invite] Error linking family members:", error);
    return NextResponse.json({ error: "Failed to link" }, { status: 500 });
  }

  return NextResponse.json({ linked: linked?.length ?? 0 });
}
