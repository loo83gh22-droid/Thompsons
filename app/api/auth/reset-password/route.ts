/**
 * Custom password-reset API route.
 *
 * Uses Supabase admin.generateLink() to create the recovery URL
 * WITHOUT sending Supabase's generic email, then sends our own
 * branded Family Nest reset email via Resend.
 */
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { checkHttpRateLimit, strictLimiter } from "@/src/lib/httpRateLimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendKey = process.env.RESEND_API_KEY;
const fromEmail =
  process.env.RESEND_FROM_EMAIL || "Family Nest <hello@send.familynest.io>";

function esc(s: string): string {
  return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkHttpRateLimit(request, strictLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, redirectTo } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate the recovery link WITHOUT sending Supabase's default email
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "recovery",
        email: email.trim(),
        options: {
          redirectTo: redirectTo || undefined,
        },
      });

    if (linkError) {
      console.error("Recovery link error:", linkError);
      // Don't reveal whether the account exists — always return success
      return NextResponse.json({ success: true });
    }

    const recoveryUrl = linkData?.properties?.action_link;
    if (!recoveryUrl) {
      console.error("No recovery URL generated");
      // Still return success to avoid leaking account existence
      return NextResponse.json({ success: true });
    }

    // Look up user's name for a personal touch
    const { data: userData } = await supabase.auth.admin.getUserById(
      linkData.user.id
    );
    const userName = esc(
      userData?.user?.user_metadata?.full_name?.split(" ")[0] || "there"
    );

    // Send branded reset email
    if (resendKey) {
      const resend = new Resend(resendKey);

      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: email.trim(),
        subject: "Reset your Family Nest password",
        html: buildPasswordResetEmail(userName, recoveryUrl),
      });

      if (emailError) {
        console.error("Failed to send reset email:", emailError);
      }
    } else {
      console.warn(
        "RESEND_API_KEY not configured — reset email not sent"
      );
    }

    // Always return success (don't leak account existence)
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Password reset error:", error);
    return NextResponse.json({ success: true });
  }
}

function buildPasswordResetEmail(name: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

<!-- Preheader text (hidden but shows in email previews) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  Reset your Family Nest password — this link expires in 24 hours.
</div>

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0e1a;">
<tr><td align="center" style="padding:40px 16px;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

  <!-- Logo & Header -->
  <tr><td style="text-align:center;padding-bottom:32px;">
    <img src="https://familynest.io/logo-m4.svg" width="64" height="64" alt="Family Nest" style="display:block;margin:0 auto;border-radius:14px;" />
    <p style="margin:12px 0 0;font-size:24px;font-weight:700;color:#D4A843;letter-spacing:-0.5px;">Family Nest</p>
  </td></tr>

  <!-- Main Card -->
  <tr><td style="background:#141927;border-radius:16px;border:1px solid #1e2640;overflow:hidden;">

    <!-- Gold accent bar -->
    <div style="height:4px;background:linear-gradient(90deg,#D4A843,#e8c56d,#D4A843);"></div>

    <div style="padding:36px 32px 40px;">

      <!-- Greeting -->
      <h1 style="margin:0 0 6px;font-size:26px;font-weight:700;color:#f0f2f8;line-height:1.3;">
        Hey ${name}! &#128274;
      </h1>
      <p style="margin:0 0 28px;font-size:16px;color:#8b93a8;line-height:1.6;">
        We received a request to reset your Family Nest password. Click the button below to choose a new one.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${resetUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#D4A843,#c49b38);color:#0a0e1a;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(212,168,67,0.3);">
          Reset My Password &#10132;
        </a>
      </div>

      <!-- Security note -->
      <div style="background:#0d111e;border-radius:12px;padding:18px 22px;margin:0 0 24px;border:1px solid #1a2038;">
        <p style="margin:0;font-size:14px;color:#8b93a8;line-height:1.6;">
          &#128161; <strong style="color:#c8cdd8;">Didn&rsquo;t request this?</strong> You can safely ignore this email &mdash; your password won&rsquo;t change unless you click the button above.
        </p>
      </div>

      <p style="margin:0;text-align:center;font-size:13px;color:#5a6278;line-height:1.5;">
        This link expires in 24 hours. If the button doesn&rsquo;t work,<br>
        copy and paste this URL into your browser:
      </p>
      <p style="margin:8px 0 0;text-align:center;font-size:11px;color:#3d4560;word-break:break-all;line-height:1.4;">
        ${resetUrl}
      </p>

    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:28px 20px;text-align:center;">
    <p style="margin:0 0 6px;color:#4a5068;font-size:12px;">
      You&rsquo;re receiving this because a password reset was requested for your account.
    </p>
    <p style="margin:0;color:#3d4560;font-size:11px;">
      Family Nest &mdash; Where your family&rsquo;s story lives forever.
    </p>
  </td></tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}
