import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { SendMessageForm } from "./SendMessageForm";

export default async function SendMessagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

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
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          Send a message
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Your message will pop up the next time recipients log in. Optionally set a date (e.g. Valentine&apos;s Day) for it to appear on that day.
        </p>
      </div>

      {!hasMessages && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-6 py-8 text-center">
          <span className="text-4xl" role="img" aria-hidden="true">&#x1F48C;</span>
          <h2 className="mt-3 font-display text-lg font-semibold text-[var(--accent)]">Send your first family message</h2>
          <p className="mt-1 max-w-sm mx-auto text-sm text-[var(--muted)]">
            Surprise someone with a note that pops up when they log in &mdash; perfect for birthdays, encouragement, or just because.
          </p>
        </div>
      )}

      <SendMessageForm
        senderFamilyMemberId={myMember?.id}
        familyMembers={familyMembers || []}
      />
    </div>
  );
}
