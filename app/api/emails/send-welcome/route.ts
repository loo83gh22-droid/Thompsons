import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/src/lib/supabase/server';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const { email, name, familyId } = await request.json();

    const supabase = await createClient();

    // Get family member ID
    const { data: member } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('family_id', familyId)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://familynest.io';
    const safeName = name.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const emailHtml = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px;">
  <tr><td style="text-align:center;padding-bottom:24px;">
    <span style="font-size:28px;color:#D4A843;font-weight:700;">Family Nest</span>
  </td></tr>
  <tr><td style="background:#1e293b;border-radius:12px;padding:32px 24px;border:1px solid #334155;">
    <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">🏡 Welcome, ${safeName}!</h1>
    <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.6;">
      Your Family Nest is ready. Start preserving memories your family will cherish for generations.
    </p>
    <div style="background:#0f172a;border-radius:8px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 12px;color:#D4A843;font-weight:600;font-size:14px;">GET STARTED IN 3 STEPS</p>
      <p style="margin:0 0 8px;color:#cbd5e1;font-size:14px;">✓ &nbsp;Add your first family member</p>
      <p style="margin:0 0 8px;color:#cbd5e1;font-size:14px;">✓ &nbsp;Upload a favourite family photo</p>
      <p style="margin:0;color:#cbd5e1;font-size:14px;">✓ &nbsp;Write one sentence about that moment</p>
    </div>
    <a href="${appUrl}/dashboard" style="display:inline-block;background:#D4A843;color:#0f172a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
      Open Family Nest →
    </a>
  </td></tr>
  <tr><td style="text-align:center;padding-top:24px;">
    <p style="color:#64748b;font-size:12px;margin:0;">Family Nest &middot; <a href="${appUrl}/dashboard/settings" style="color:#64748b;">Manage notifications</a></p>
  </td></tr>
</table>
</body>
</html>`;

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Our Family Nest <notifications@resend.dev>',
      to: email,
      subject: `Welcome to Family Nest, ${safeName}! 🏡`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending welcome email:', emailError);
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    // Track email sent
    if (member) {
      await supabase.from('email_campaigns').insert({
        family_member_id: member.id,
        campaign_type: 'welcome',
      });
    }

    return NextResponse.json({ success: true, emailId: emailData?.id });
  } catch (error: any) {
    console.error('Error in send-welcome:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
