/**
 * Resends the branded confirmation email for an unconfirmed signup.
 * Generates a fresh confirmation link via the Supabase admin API
 * and sends it through our own Resend template (not Supabase's default email).
 */
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { checkHttpRateLimit, strictLimiter } from "@/src/lib/httpRateLimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "Family Nest <hello@send.familynest.io>";

function esc(s: string): string {
  return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkHttpRateLimit(request, strictLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate a magic link for the unconfirmed user — confirms their email on click
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: email.trim(),
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Resend confirmation link error:", linkError);
      return NextResponse.json({ error: "Could not generate confirmation link" }, { status: 400 });
    }

    const confirmationUrl = linkData.properties.action_link;
    const safeName = esc(linkData.user?.user_metadata?.full_name || "there");

    if (!resendKey) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const resend = new Resend(resendKey);
    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: email.trim(),
      subject: `${safeName}, here's your new Family Nest confirmation link`,
      html: buildResendEmail(safeName, confirmationUrl),
    });

    if (emailError) {
      console.error("Failed to resend confirmation email:", emailError);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Resend confirmation error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

function buildResendEmail(name: string, confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0e1a;">
<tr><td align="center" style="padding:40px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

  <tr><td style="text-align:center;padding-bottom:32px;">
    <img src="https://familynest.io/logo-m4.svg" width="64" height="64" alt="Family Nest" style="display:block;margin:0 auto;border-radius:14px;" />
    <p style="margin:12px 0 0;font-size:24px;font-weight:700;color:#D4A843;letter-spacing:-0.5px;">Family Nest</p>
  </td></tr>

  <tr><td style="background:#141927;border-radius:16px;border:1px solid #1e2640;overflow:hidden;">
    <div style="height:4px;background:linear-gradient(90deg,#D4A843,#e8c56d,#D4A843);"></div>
    <div style="padding:36px 32px 40px;">
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f0f2f8;">Here&rsquo;s a fresh link, ${name}</h1>
      <p style="margin:0 0 28px;font-size:15px;color:#8b93a8;line-height:1.6;">
        You requested a new confirmation email. Click below to verify your account and get started.
      </p>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${confirmUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#D4A843,#c49b38);color:#0a0e1a;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(212,168,67,0.3);">
          Confirm My Email &amp; Get Started &#10132;
        </a>
      </div>
      <p style="margin:0;text-align:center;font-size:13px;color:#5a6278;line-height:1.5;">
        This link expires in 24 hours. If you didn&rsquo;t request this, you can safely ignore it.
      </p>
    </div>
  </td></tr>

  <tr><td style="padding:24px 20px;text-align:center;">
    <p style="margin:0;color:#3d4560;font-size:11px;">Family Nest &mdash; Where your family&rsquo;s story lives forever.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
