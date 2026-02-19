/**
 * Custom signup API route.
 *
 * Uses Supabase admin.generateLink() to create the confirmation URL
 * WITHOUT sending Supabase's generic email, then sends our own
 * beautifully branded Family Nest confirmation email via Resend.
 */
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "Family Nest <onboarding@resend.dev>";

function esc(s: string): string {
  return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, familyName, relationship, redirectTo } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate the signup link WITHOUT sending Supabase's default email
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: {
          full_name: name?.trim() || undefined,
          relationship: relationship?.trim() || undefined,
          family_name: familyName?.trim() || undefined,
        },
        redirectTo: redirectTo || undefined,
      },
    });

    if (linkError) {
      // Handle "user already registered" nicely
      if (linkError.message?.includes("already been registered") || linkError.message?.includes("already exists")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in instead." },
          { status: 409 }
        );
      }
      console.error("Signup link error:", linkError);
      return NextResponse.json({ error: linkError.message }, { status: 400 });
    }

    // Extract the confirmation URL from the generated link properties
    const confirmationUrl = linkData?.properties?.action_link;
    if (!confirmationUrl) {
      console.error("No confirmation URL generated");
      return NextResponse.json({ error: "Failed to generate confirmation" }, { status: 500 });
    }

    // Send our beautiful branded confirmation email
    const safeName = esc(name?.trim() || "there");
    const safeFamilyName = esc(familyName?.trim() || "Your Family");

    if (resendKey) {
      const resend = new Resend(resendKey);

      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: email.trim(),
        subject: `${safeName}, confirm your Family Nest account`,
        html: buildConfirmationEmail(safeName, safeFamilyName, confirmationUrl),
      });

      if (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Still return success — the user was created, we just couldn't email
        return NextResponse.json({
          success: true,
          emailSent: false,
          message: "Account created but confirmation email failed. Please try resending.",
        });
      }
    } else {
      console.warn("RESEND_API_KEY not configured — confirmation email not sent");
      return NextResponse.json({
        success: true,
        emailSent: false,
        message: "Account created but email service not configured.",
      });
    }

    return NextResponse.json({ success: true, emailSent: true });
  } catch (error: unknown) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Signup failed" },
      { status: 500 }
    );
  }
}

function buildConfirmationEmail(name: string, familyName: string, confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

<!-- Preheader text (hidden but shows in email previews) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  Welcome to Family Nest! Confirm your email to start building ${familyName}'s digital home.
</div>

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0e1a;">
<tr><td align="center" style="padding:40px 16px;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

  <!-- Logo & Header -->
  <tr><td style="text-align:center;padding-bottom:32px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#D4A843,#b8912e);width:56px;height:56px;border-radius:16px;line-height:56px;font-size:28px;text-align:center;">&#127969;</div>
    <p style="margin:12px 0 0;font-size:24px;font-weight:700;color:#D4A843;letter-spacing:-0.5px;">Family Nest</p>
  </td></tr>

  <!-- Main Card -->
  <tr><td style="background:#141927;border-radius:16px;border:1px solid #1e2640;overflow:hidden;">

    <!-- Gold accent bar -->
    <div style="height:4px;background:linear-gradient(90deg,#D4A843,#e8c56d,#D4A843);"></div>

    <div style="padding:36px 32px 40px;">

      <!-- Greeting -->
      <h1 style="margin:0 0 6px;font-size:26px;font-weight:700;color:#f0f2f8;line-height:1.3;">
        Hey ${name}! &#127881;
      </h1>
      <p style="margin:0 0 24px;font-size:16px;color:#8b93a8;line-height:1.6;">
        You just took the first step to something amazing &mdash; building <strong style="color:#D4A843;">${familyName}&rsquo;s</strong> very own digital family home.
      </p>

      <!-- What awaits section -->
      <div style="background:#0d111e;border-radius:12px;padding:20px 24px;margin:0 0 28px;border:1px solid #1a2038;">
        <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#D4A843;text-transform:uppercase;letter-spacing:1px;">What&rsquo;s waiting for you inside</p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr><td style="padding:5px 0;color:#c8cdd8;font-size:14px;line-height:1.5;">&#128247;&ensp; <strong>Photo albums</strong> everyone can add to</td></tr>
          <tr><td style="padding:5px 0;color:#c8cdd8;font-size:14px;line-height:1.5;">&#128214;&ensp; <strong>Family journal</strong> &mdash; stories worth keeping</td></tr>
          <tr><td style="padding:5px 0;color:#c8cdd8;font-size:14px;line-height:1.5;">&#127758;&ensp; <strong>Family map</strong> with pins for every memory</td></tr>
          <tr><td style="padding:5px 0;color:#c8cdd8;font-size:14px;line-height:1.5;">&#127873;&ensp; <strong>Birthday & event reminders</strong> you&rsquo;ll never miss</td></tr>
          <tr><td style="padding:5px 0;color:#c8cdd8;font-size:14px;line-height:1.5;">&#128140;&ensp; <strong>Time capsules</strong> to open in the future</td></tr>
          <tr><td style="padding:5px 0;color:#c8cdd8;font-size:14px;line-height:1.5;">&#127860;&ensp; <strong>Family recipes</strong> passed down for generations</td></tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${confirmUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#D4A843,#c49b38);color:#0a0e1a;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(212,168,67,0.3);">
          Confirm My Email &amp; Get Started &#10132;
        </a>
      </div>

      <p style="margin:0;text-align:center;font-size:13px;color:#5a6278;line-height:1.5;">
        This link expires in 24 hours. If the button doesn&rsquo;t work,<br>
        copy and paste this URL into your browser:
      </p>
      <p style="margin:8px 0 0;text-align:center;font-size:11px;color:#3d4560;word-break:break-all;line-height:1.4;">
        ${confirmUrl}
      </p>

    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:28px 20px;text-align:center;">
    <p style="margin:0 0 6px;color:#4a5068;font-size:12px;">
      You&rsquo;re receiving this because you signed up at Family Nest.
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
