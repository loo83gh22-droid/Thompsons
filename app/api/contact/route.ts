import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const ADMIN_EMAIL = process.env.FEEDBACK_ADMIN_EMAIL;
const FROM_EMAIL = "Family Nest <noreply@familynest.io>";

export async function POST(request: NextRequest) {
  if (!resend || !ADMIN_EMAIL) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, category, message, errorId } = body as Record<string, string>;

  // Basic validation
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (message.trim().length > 5000) {
    return NextResponse.json({ error: "Message too long (max 5000 characters)" }, { status: 400 });
  }

  const safeName = esc(name.trim());
  const safeEmail = esc(email.trim());
  const safeCategory = esc(category?.trim() || "General");
  const safeMessage = esc(message.trim());
  const safeErrorId = errorId ? esc(errorId.trim()) : null;

  const subject = `[Family Nest] ${safeCategory} — from ${safeName}`;

  const html = buildAdminEmail(safeName, safeEmail, safeCategory, safeMessage, safeErrorId);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: email.trim(),
      subject,
      html,
    });
  } catch (err) {
    console.error("Contact form send error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  // Send a confirmation to the sender
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email.trim(),
      subject: "We got your message — Family Nest",
      html: buildConfirmationEmail(safeName, safeCategory, safeMessage),
    });
  } catch {
    // Confirmation failure is non-fatal — admin already notified
  }

  return NextResponse.json({ success: true });
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildAdminEmail(
  name: string,
  email: string,
  category: string,
  message: string,
  errorId: string | null
): string {
  const errorRow = errorId
    ? `<tr><td style="padding:8px 0;color:#8b93a8;font-size:13px;width:100px;">Error ID</td><td style="padding:8px 0;color:#f0f2f8;font-size:13px;font-family:monospace;">${errorId}</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;">
<tr><td align="center" style="padding:40px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

  <tr><td style="text-align:center;padding-bottom:24px;">
    <p style="margin:0;font-size:22px;font-weight:700;color:#D4A843;">Family Nest</p>
    <p style="margin:4px 0 0;font-size:13px;color:#5a6278;">Contact Form Submission</p>
  </td></tr>

  <tr><td style="background:#141927;border-radius:16px;border:1px solid #1e2640;padding:28px 32px;">

    <div style="background:#0d111e;border-radius:10px;padding:20px;margin-bottom:24px;border:1px solid #1a2038;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;color:#8b93a8;font-size:13px;width:100px;">From</td><td style="padding:8px 0;color:#f0f2f8;font-size:13px;">${name}</td></tr>
        <tr><td style="padding:8px 0;color:#8b93a8;font-size:13px;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#D4A843;font-size:13px;">${email}</a></td></tr>
        <tr><td style="padding:8px 0;color:#8b93a8;font-size:13px;">Category</td><td style="padding:8px 0;color:#f0f2f8;font-size:13px;">${category}</td></tr>
        ${errorRow}
      </table>
    </div>

    <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#D4A843;text-transform:uppercase;letter-spacing:1px;">Message</p>
    <div style="background:#0d111e;border-radius:10px;padding:20px;border:1px solid #1a2038;">
      <p style="margin:0;font-size:14px;color:#c8cdd8;line-height:1.7;white-space:pre-wrap;">${message}</p>
    </div>

    <p style="margin:24px 0 0;font-size:12px;color:#3d4560;text-align:center;">
      Hit Reply to respond directly to ${name}.
    </p>

  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildConfirmationEmail(name: string, category: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;">
<tr><td align="center" style="padding:40px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

  <tr><td style="text-align:center;padding-bottom:24px;">
    <p style="margin:0;font-size:22px;font-weight:700;color:#D4A843;">Family Nest</p>
  </td></tr>

  <tr><td style="background:#141927;border-radius:16px;border:1px solid #1e2640;padding:28px 32px;">

    <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#f0f2f8;">Thanks, ${name}!</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#c8cdd8;line-height:1.7;">
      We received your message (${category}) and will get back to you as soon as possible.
    </p>

    <div style="background:#0d111e;border-radius:10px;padding:16px 20px;border:1px solid #1a2038;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#D4A843;text-transform:uppercase;letter-spacing:1px;">Your message</p>
      <p style="margin:0;font-size:13px;color:#8b93a8;line-height:1.6;white-space:pre-wrap;">${message.length > 300 ? message.slice(0, 300) + "…" : message}</p>
    </div>

    <p style="margin:0;font-size:13px;color:#5a6278;text-align:center;">
      Family Nest &mdash; Private. Permanent. Yours.
    </p>

  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
