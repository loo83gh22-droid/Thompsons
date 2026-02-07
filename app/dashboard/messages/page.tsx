import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { SendMessageForm } from "./SendMessageForm";

export default async function SendMessagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: familyMembers } = await supabase
    .from("family_members")
    .select("id, name")
    .eq("family_id", activeFamilyId)
    .order("name");

  const { data: myMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        Send a message
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Your message will pop up the next time recipients log in. Optionally set a date (e.g. Valentine&apos;s Day) for it to appear on that day.
      </p>

      <SendMessageForm
        senderFamilyMemberId={myMember?.id}
        familyMembers={familyMembers || []}
      />
    </div>
  );
}
