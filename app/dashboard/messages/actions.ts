"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { Resend } from "resend";

export async function sendFamilyMessage(
  senderFamilyMemberId: string,
  title: string,
  content: string,
  recipientIds: string[], // empty = all family
  showOnDate?: string // YYYY-MM-DD, optional for date-specific (e.g. Valentine's)
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { data: message, error: msgError } = await supabase
    .from("family_messages")
    .insert({
      family_id: activeFamilyId,
      sender_id: senderFamilyMemberId,
      title,
      content,
      show_on_date: showOnDate || null,
    })
    .select("id")
    .single();

  if (msgError) throw msgError;

  if (recipientIds.length > 0) {
    await supabase.from("family_message_recipients").insert(
      recipientIds.map((fmId) => ({
        message_id: message.id,
        family_member_id: fmId,
      }))
    );
  }

  revalidatePath("/dashboard");

  // Send email notifications (optional - requires RESEND_API_KEY)
  if (process.env.RESEND_API_KEY) {
    const { data: sender } = await supabase
      .from("family_members")
      .select("name")
      .eq("id", senderFamilyMemberId)
      .single();

    let memberIds = recipientIds;
    if (memberIds.length === 0) {
      const { data: all } = await supabase.from("family_members").select("id").eq("family_id", activeFamilyId);
      memberIds = (all || []).map((m) => m.id);
    }

    const { data: members } = await supabase
      .from("family_members")
      .select("contact_email")
      .in("id", memberIds);

    const emails = (members || []).map((m) => m.contact_email).filter(Boolean) as string[];
    if (emails.length > 0) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.RESEND_FROM_EMAIL || "Family Nest <noreply@send.familynest.io>";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://familynest.io");
      const safeTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const safeContent = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const safeSender = sender?.name?.replace(/</g, "&lt;").replace(/>/g, "&gt;") || "";
      resend.emails.send({
        from,
        to: emails,
        subject: `New family message: ${title}`,
        html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px;">
<tr><td style="text-align:center;padding-bottom:24px;">
  <span style="font-size:28px;color:#D4A843;font-weight:700;">Family Nest</span>
</td></tr>
<tr><td style="background:#1e293b;border-radius:12px;padding:32px 24px;border:1px solid #334155;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">💬 ${safeTitle}</h1>
  ${safeSender ? `<p style="margin:0 0 16px;color:#64748b;font-size:13px;">From ${safeSender}</p>` : ""}
  <div style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;white-space:pre-wrap;">${safeContent}</div>
  <a href="${appUrl}/dashboard" style="display:inline-block;background:#D4A843;color:#0f172a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
    View in Family Nest
  </a>
</td></tr>
<tr><td style="text-align:center;padding-top:24px;">
  <p style="color:#64748b;font-size:12px;margin:0;">Family Nest &middot; <a href="${appUrl}/dashboard/settings" style="color:#64748b;">Manage notifications</a></p>
</td></tr>
</table>
</body></html>`,
      }).catch(() => {});
    }
  }

  return message.id;
}

export async function markMessageAsRead(messageId: string, familyMemberId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("family_message_reads").insert({
    message_id: messageId,
    family_member_id: familyMemberId,
  });
  if (error && error.code !== "23505") throw error; // ignore duplicate

  revalidatePath("/dashboard");
}
