import { createClient } from "@/src/lib/supabase/server";
import { MessagePopup } from "./MessagePopup";

export async function UnreadMessagesFetcher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: myMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!myMember) return null;

  const today = new Date().toISOString().slice(0, 10);

  // Get all messages that could be for this user
  const { data: allMessages } = await supabase
    .from("family_messages")
    .select("id, title, content, show_on_date, created_at, sender_id")
    .or(`show_on_date.is.null,show_on_date.lte.${today}`)
    .order("created_at", { ascending: false });

  if (!allMessages?.length) return null;

  // Get recipient lists for messages that have specific recipients
  const { data: recipients } = await supabase
    .from("family_message_recipients")
    .select("message_id, family_member_id")
    .in("message_id", allMessages.map((m) => m.id));

  // Get read status
  const { data: reads } = await supabase
    .from("family_message_reads")
    .select("message_id")
    .eq("family_member_id", myMember.id)
    .in("message_id", allMessages.map((m) => m.id));

  const readIds = new Set((reads || []).map((r) => r.message_id));

  // Filter: for me, and unread
  const unread = allMessages.filter((m) => {
    if (readIds.has(m.id)) return false;
    const messageRecipients = (recipients || []).filter((r) => r.message_id === m.id);
    if (messageRecipients.length === 0) return true; // no recipients = all
    return messageRecipients.some((r) => r.family_member_id === myMember.id);
  });

  if (unread.length === 0) return null;

  const senderIds = [...new Set(unread.map((m) => m.sender_id).filter(Boolean))];
  const { data: senders } = senderIds.length
    ? await supabase.from("family_members").select("id, name").in("id", senderIds)
    : { data: [] };
  const senderMap = new Map((senders || []).map((s) => [s.id, s]));

  const formatted = unread.map((m) => ({
    id: m.id,
    title: m.title,
    content: m.content,
    show_on_date: m.show_on_date,
    created_at: m.created_at,
    sender: m.sender_id ? (senderMap.get(m.sender_id) ?? null) : null,
  }));

  return (
    <MessagePopup
      messages={formatted}
      familyMemberId={myMember.id}
    />
  );
}
