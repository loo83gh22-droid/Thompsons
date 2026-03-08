import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { Resend } from "resend";
import { esc, emailWrapper, card, ctaButton, appUrl as baseAppUrl } from "@/app/api/emails/templates/shared";
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
          // Capture linked rows so we can send a "member joined" notification to the family owner
          const { data: linkedMembers } = await adminClient
            .from('family_members')
            .update({ user_id: user.id })
            .eq('contact_email', user.email)
            .is('user_id', null)
            .select('id, name, family_id, role');

          if (linkedMembers?.length && process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'Family Nest <hello@send.familynest.io>';

            for (const joined of linkedMembers) {
              if (joined.role === 'owner') continue; // owner creating their own account — no notification needed

              const { data: owners } = await adminClient
                .from('family_members')
                .select('contact_email, name, families(name)')
                .eq('family_id', joined.family_id)
                .eq('role', 'owner')
                .not('contact_email', 'is', null);

              for (const owner of owners ?? []) {
                if (!owner.contact_email) continue;
                const familyRecord = owner.families as { name?: string } | null;
                const familyName = esc(familyRecord?.name ?? 'your family');
                const memberName = esc(joined.name ?? 'A family member');
                const ownerName = esc(owner.name ?? 'there');
                const html = emailWrapper(card(`
                  <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f0f2f8;">🎉 ${memberName} just joined!</h2>
                  <p style="margin:0 0 20px;font-size:15px;color:#94a3b8;line-height:1.6;">Hi ${ownerName} — ${memberName} just accepted their invite and joined <strong style="color:#D4A843;">${familyName}</strong>'s Nest.</p>
                  <p style="margin:0 0 24px;font-size:14px;color:#64748b;">Your family is growing. Head to your dashboard to see who's online.</p>
                  ${ctaButton('Open Family Nest', `${baseAppUrl}/dashboard`)}
                `));
                await resend.emails.send({
                  from: fromEmail,
                  to: owner.contact_email,
                  subject: `${memberName} just joined ${familyName}'s Nest 🎉`,
                  html,
                }).catch(err => console.error('[auth/callback] member-joined email error:', err));
              }
            }
          }
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
              // Await the fetch — Vercel terminates serverless functions after the
              // response is sent, so fire-and-forget would be silently killed.
              await fetch(`${origin}/api/emails/send-welcome`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: emailTo,
                  name: member?.name || user.email?.split('@')[0] || 'there',
                  familyId: member?.family_id,
                }),
              }).catch(err => console.error('[auth/callback] Failed to send welcome email:', err));
            }
          }
        }
      } catch (err) {
        console.error('Error checking for welcome email:', err);
        // Don't fail auth callback if email fails
      }

      const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
