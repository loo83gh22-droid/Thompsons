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
      const from = process.env.RESEND_FROM_EMAIL || "Thompsons <onboarding@resend.dev>";
      resend.emails.send({
        from,
        to: emails,
        subject: `Family message: ${title}`,
        html: `
          <h2>${title}</h2>
          ${sender?.name ? `<p><em>From ${sender.name}</em></p>` : ""}
          <div style="white-space: pre-wrap;">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          <p style="margin-top: 24px; color: #888; font-size: 12px;">
            Log in to the Thompsons family site to see this message.
          </p>
        `,
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
