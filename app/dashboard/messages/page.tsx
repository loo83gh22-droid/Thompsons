import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { SendMessageForm } from "./SendMessageForm";
import { EmptyState } from "@/app/dashboard/components/EmptyState";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata = { title: "Messages | Family Nest" };

export default async function SendMessagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const [{ data: familyMembers }, { data: myMember }, { count: messageCount }] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, name")
      .eq("family_id", activeFamilyId)
      .order("name"),
    supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single(),
    supabase
      .from("family_messages")
      .select("id", { count: "exact", head: true })
      .eq("family_id", activeFamilyId),
  ]);

  const hasMessages = (messageCount ?? 0) > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          Messages
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Leave a note for someone. It&apos;ll pop up next time they log in, or pick a date to surprise them.
        </p>
      </div>

      {!hasMessages && (
        <EmptyState
          icon="💌"
          headline="Send your first family message"
          description="Surprise someone with a note that pops up when they log in. Perfect for birthdays, encouragement, or just because."
        />
      )}

      <SendMessageForm
        senderFamilyMemberId={myMember?.id}
        familyMembers={familyMembers || []}
      />
    </div>
  );
}
