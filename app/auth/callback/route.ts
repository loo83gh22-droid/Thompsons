import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Link auth user to any existing family_members record with matching contact_email.
      // Must use admin client — RLS blocks invited users from reading rows in families
      // they aren't linked to yet, causing the update to silently find nothing.
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const adminClient = createAdminClient();
          await adminClient
            .from('family_members')
            .update({ user_id: user.id })
            .eq('contact_email', user.email)
            .is('user_id', null);
        }
      } catch (err) {
        console.error('Error linking user to family member:', err);
      }

      // Send welcome email to new users
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Check if this is a new signup (user created recently)
          const userCreatedAt = new Date(user.created_at);
          const timeSinceCreation = Date.now() - userCreatedAt.getTime();
          // 72-hour window: covers anyone who signs up but takes time to check email.
          // The send-welcome route deduplicates via email_campaigns so double-sends are safe.
          const isNewUser = timeSinceCreation < 72 * 60 * 60 * 1000;

          if (isNewUser) {
            // Get family member details
            const { data: member } = await supabase
              .from('family_members')
              .select('id, name, contact_email, family_id, families(name)')
              .eq('user_id', user.id)
              .single();

            const emailTo = member?.contact_email || user.email;
            if (emailTo && process.env.RESEND_API_KEY) {
              // Send welcome email asynchronously (don't block redirect)
              fetch(`${origin}/api/emails/send-welcome`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: emailTo,
                  name: member?.name || user.email?.split('@')[0] || 'there',
                  familyId: member?.family_id,
                }),
              }).catch(err => console.error('Failed to send welcome email:', err));
            }
          }
        }
      } catch (err) {
        console.error('Error checking for welcome email:', err);
        // Don't fail auth callback if email fails
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
