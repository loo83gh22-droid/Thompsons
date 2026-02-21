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

    // Get family member and family name
    const { data: { user } } = await supabase.auth.getUser();
    const { data: member } = await supabase
      .from('family_members')
      .select('id, family_id, families(name)')
      .eq('user_id', user?.id)
      .eq('family_id', familyId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const familyRecord = member?.families as any;
    const familyName: string = familyRecord?.name || 'Your Family';

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://familynest.io';
    const safeName = esc(name || 'there');
    const safeFamilyName = esc(familyName);

    const emailHtml = buildWelcomeEmail(safeName, safeFamilyName, appUrl);

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Family Nest <notifications@resend.dev>',
      to: email,
      subject: `You're in! ${safeFamilyName}'s Nest is ready`,
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
  } catch (error: unknown) {
    console.error('Error in send-welcome:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function esc(s: string): string {
  return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildWelcomeEmail(name: string, familyName: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  ${familyName}'s Nest is live! Here's how to make it amazing in your first 5 minutes.
</div>

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0e1a;">
<tr><td align="center" style="padding:40px 16px;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

  <!-- Logo -->
  <tr><td style="text-align:center;padding-bottom:32px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#D4A843,#b8912e);width:56px;height:56px;border-radius:16px;line-height:56px;font-size:28px;text-align:center;">&#127969;</div>
    <p style="margin:12px 0 0;font-size:24px;font-weight:700;color:#D4A843;letter-spacing:-0.5px;">Family Nest</p>
  </td></tr>

  <!-- Main Card -->
  <tr><td style="background:#141927;border-radius:16px;border:1px solid #1e2640;overflow:hidden;">

    <!-- Celebration banner -->
    <div style="background:linear-gradient(135deg,#1a2545,#1e2640);padding:28px 32px;text-align:center;border-bottom:1px solid #1e2640;">
      <p style="margin:0;font-size:40px;line-height:1;">&#127881;&#127969;&#127881;</p>
      <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:#f0f2f8;line-height:1.3;">
        ${familyName}&rsquo;s Nest Is Live!
      </h1>
      <p style="margin:8px 0 0;font-size:15px;color:#8b93a8;">
        Congratulations, ${name} &mdash; you&rsquo;re the founding Nest Keeper!
      </p>
    </div>

    <div style="padding:32px 32px 36px;">

      <!-- Personal welcome -->
      <p style="margin:0 0 20px;font-size:15px;color:#c8cdd8;line-height:1.7;">
        This is the beginning of something really special. Every family photo, every recipe, every funny story, every
        &ldquo;remember when&rdquo; moment &mdash; it all has a home now. And <strong style="color:#D4A843;">you</strong>
        made it happen.
      </p>

      <!-- Quick start steps -->
      <div style="background:#0d111e;border-radius:12px;padding:24px;margin:0 0 28px;border:1px solid #1a2038;">
        <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#D4A843;text-transform:uppercase;letter-spacing:1px;">
          &#9889; Your first 5 minutes
        </p>

        <!-- Step 1 -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:14px;">
        <tr>
          <td width="32" valign="top">
            <div style="width:28px;height:28px;border-radius:50%;background:#D4A843;color:#0a0e1a;font-weight:700;font-size:14px;text-align:center;line-height:28px;">1</div>
          </td>
          <td style="padding-left:12px;color:#c8cdd8;font-size:14px;line-height:1.6;">
            <strong style="color:#f0f2f8;">Invite your people</strong><br>
            Go to <span style="color:#D4A843;">Members</span> and add family by name or email &mdash; they&rsquo;ll get their own warm invite
          </td>
        </tr>
        </table>

        <!-- Step 2 -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:14px;">
        <tr>
          <td width="32" valign="top">
            <div style="width:28px;height:28px;border-radius:50%;background:#D4A843;color:#0a0e1a;font-weight:700;font-size:14px;text-align:center;line-height:28px;">2</div>
          </td>
          <td style="padding-left:12px;color:#c8cdd8;font-size:14px;line-height:1.6;">
            <strong style="color:#f0f2f8;">Drop in a photo</strong><br>
            Upload a favourite family pic &mdash; it becomes the first memory in your Nest
          </td>
        </tr>
        </table>

        <!-- Step 3 -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td width="32" valign="top">
            <div style="width:28px;height:28px;border-radius:50%;background:#D4A843;color:#0a0e1a;font-weight:700;font-size:14px;text-align:center;line-height:28px;">3</div>
          </td>
          <td style="padding-left:12px;color:#c8cdd8;font-size:14px;line-height:1.6;">
            <strong style="color:#f0f2f8;">Write a quick journal entry</strong><br>
            Even one sentence &mdash; future you will love looking back at it
          </td>
        </tr>
        </table>
      </div>

      <!-- Fun fact callout -->
      <div style="background:rgba(212,168,67,0.08);border:1px solid rgba(212,168,67,0.2);border-radius:10px;padding:16px 20px;margin:0 0 28px;">
        <p style="margin:0;font-size:14px;color:#c8cdd8;line-height:1.6;">
          <strong style="color:#D4A843;">Fun fact:</strong> Families who add their first photo in the first day
          are 3x more likely to keep their Nest active for years. No pressure though &#128521;
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;">
        <a href="${appUrl}/dashboard"
           style="display:inline-block;background:linear-gradient(135deg,#D4A843,#c49b38);color:#0a0e1a;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(212,168,67,0.3);">
          Open ${familyName}&rsquo;s Nest &#10132;
        </a>
      </div>

    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:28px 20px;text-align:center;">
    <p style="margin:0 0 4px;color:#5a6278;font-size:13px;">
      Welcome to the Family Nest family &#128155;
    </p>
    <p style="margin:0;color:#3d4560;font-size:11px;">
      <a href="${appUrl}/dashboard/settings" style="color:#4a5068;text-decoration:underline;">Manage notifications</a>
      &ensp;&middot;&ensp;Family Nest
    </p>
  </td></tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}
