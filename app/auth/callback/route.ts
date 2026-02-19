import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Send welcome email to new users
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Check if this is a new signup (user created recently)
          const userCreatedAt = new Date(user.created_at);
          const timeSinceCreation = Date.now() - userCreatedAt.getTime();
          const isNewUser = timeSinceCreation < 60000; // Within last minute

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
