import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId, getActiveFamilyName } from "@/src/lib/family";
import { Resend } from "resend";
import crypto from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://familynest.io";

type ItemType = "journal" | "memo" | "story";
type ItemInput = { type: ItemType; id: string; title: string };

const TABLE_MAP: Record<ItemType, string> = {
  journal: "journal_entries",
  memo: "voice_memos",
  story: "family_stories",
};

function getSharePath(type: ItemType, token: string) {
  if (type === "memo") return `${APP_URL}/share/memo/${token}`;
  if (type === "journal") return `${APP_URL}/share/journal/${token}`;
  return `${APP_URL}/share/story/${token}`;
}

function itemTypeIcon(type: ItemType) {
  if (type === "journal") return "📔";
  if (type === "memo") return "🎙️";
  return "📖";
}

function itemTypeLabel(type: ItemType) {
  if (type === "journal") return "Journal entry";
  if (type === "memo") return "Voice memo";
  return "Story";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      contactIds: string[];
      subject?: string;
      message?: string;
      items: ItemInput[];
    };

    const { contactIds, subject, message, items } = body;

    if (!contactIds?.length || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const familyName = await getActiveFamilyName(supabase);
    const safeFamilyName = (familyName || "Our Family").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Ensure each item has a share token and build share URLs
    const resolvedItems: { type: ItemType; title: string; url: string }[] = [];

    for (const item of items) {
      const table = TABLE_MAP[item.type];
      const newToken = crypto.randomBytes(16).toString("hex");

      // Set share token only if not already set
      await supabase
        .from(table)
        .update({ is_public: true, share_token: newToken })
        .eq("id", item.id)
        .is("share_token", null);

      // Fetch the actual (possibly pre-existing) token
      const { data: row } = await supabase
        .from(table)
        .select("share_token")
        .eq("id", item.id)
        .single();

      const token = (row as { share_token: string | null } | null)?.share_token;
      if (token) {
        resolvedItems.push({
          type: item.type,
          title: item.title,
          url: getSharePath(item.type, token),
        });
      }
    }

    if (resolvedItems.length === 0) {
      return NextResponse.json({ error: "Could not generate share links" }, { status: 500 });
    }

    // Fetch contact emails
    const { data: contactRows } = await supabase
      .from("family_contacts")
      .select("name, email")
      .in("id", contactIds)
      .eq("family_id", activeFamilyId)
      .not("email", "is", null);

    if (!contactRows?.length) {
      return NextResponse.json({ error: "No valid contacts with emails" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Email not configured" }, { status: 500 });

    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || "Family Nest <onboarding@resend.dev>";

    const subjectLine = subject?.trim() || `An update from the ${safeFamilyName} Family`;
    const safeSubject = subjectLine.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeMessage = message?.trim()
      ? message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")
      : null;

    // Build item list HTML
    const itemsHtml = resolvedItems
      .map(
        (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #1e2640;">
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="width:32px;vertical-align:top;padding-top:2px;font-size:18px;">${itemTypeIcon(item.type)}</td>
              <td style="vertical-align:top;">
                <a href="${item.url}" style="color:#D4A843;font-size:15px;font-weight:600;text-decoration:none;line-height:1.4;">${item.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</a>
                <p style="margin:2px 0 0;font-size:12px;color:#6b7890;">${itemTypeLabel(item.type)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
      )
      .join("");

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
        ${safeSubject}
      </h1>
      ${safeMessage
        ? `<p style="margin:0 0 24px;font-size:15px;color:#8892aa;line-height:1.7;">${safeMessage.replace(/\n/g, "<br>")}</p>`
        : `<p style="margin:0 0 24px;font-size:15px;color:#8892aa;line-height:1.6;">Here are a few recent moments from the ${safeFamilyName} Family.</p>`
      }
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
        ${itemsHtml}
      </table>
      <p style="margin:0;font-size:13px;color:#6b7890;line-height:1.5;">
        Click any link above to view it. No account needed.
      </p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #1e2640;">
      <p style="margin:0 0 12px;font-size:12px;color:#4a5568;line-height:1.5;">
        You're receiving this because the ${safeFamilyName} Family wanted to share these moments with you. You don't need an account to view them. Nothing else in their Family Nest is visible to you.
      </p>
      <a href="${APP_URL}/login" style="display:inline-block;background:#1e2640;color:#D4A843;font-size:12px;font-weight:600;padding:8px 16px;border-radius:8px;text-decoration:none;">
        Start Your Own Family Nest &rarr;
      </a>
    </div>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    // Send to each contact
    const sends = contactRows.map((c) =>
      resend.emails.send({
        from,
        to: c.email!,
        subject: subjectLine,
        html: emailHtml,
      })
    );
    await Promise.all(sends);

    return NextResponse.json({ sent: contactRows.length });
  } catch (err) {
    console.error("send-digest error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
