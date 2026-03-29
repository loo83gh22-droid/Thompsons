import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId, getActiveFamilyName } from "@/src/lib/family";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { contactIds, shareUrl, shareType, title, message } = await req.json();

    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const familyName = await getActiveFamilyName(supabase);

    // Fetch the selected contacts
    const { data: contacts } = await supabase
      .from("family_contacts")
      .select("name, email")
      .in("id", contactIds)
      .eq("family_id", activeFamilyId)
      .not("email", "is", null);

    if (!contacts?.length) return NextResponse.json({ error: "No valid contacts" }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Email not configured" }, { status: 500 });

    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || "Family Nest <onboarding@resend.dev>";

    const safeTitle = (title || `a ${shareType}`).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeFamilyName = (familyName || "Our Family").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeMessage = message ? message.replace(/</g, "&lt;").replace(/>/g, "&gt;") : null;

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0e1a;">
<tr><td align="center" style="padding:40px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">
  <tr><td style="text-align:center;padding-bottom:32px;">
    <img src="https://familynest.io/logo-m4.svg" width="64" height="64" alt="Family Nest" style="display:block;margin:0 auto;border-radius:14px;" />
    <p style="margin:12px 0 0;font-size:24px;font-weight:700;color:#D4A843;letter-spacing:-0.5px;">Family Nest</p>
  </td></tr>
  <tr><td style="background:#141927;border-radius:16px;border:1px solid #1e2640;overflow:hidden;">
    <div style="padding:32px 32px 24px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f0f4ff;line-height:1.3;">
        ${safeFamilyName} shared something with you
      </h1>
      <p style="margin:0 0 24px;font-size:15px;color:#8892aa;line-height:1.6;">
        ${safeMessage ? safeMessage : `They wanted you to see: <strong style="color:#f0f4ff;">${safeTitle}</strong>`}
      </p>
      <a href="${shareUrl}" style="display:inline-block;background:#D4A843;color:#0a0e1a;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;letter-spacing:-0.2px;">
        View ${shareType} &rarr;
      </a>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #1e2640;">
      <p style="margin:0;font-size:12px;color:#4a5568;line-height:1.5;">
        This is a one-time share from ${safeFamilyName}&apos;s private Family Nest.
        You don&apos;t need an account to view it. Nothing else in their Nest is visible to you.
      </p>
    </div>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    // Send to each contact individually
    const sends = contacts.map((c) =>
      resend.emails.send({
        from,
        to: c.email!,
        subject: `${safeFamilyName} shared ${safeTitle} with you`,
        html: emailHtml,
      })
    );
    await Promise.all(sends);

    return NextResponse.json({ sent: contacts.length });
  } catch (err) {
    console.error("send-share error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
