import type { Metadata } from "next";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { QuotesFeed } from "./QuotesFeed";

export const metadata: Metadata = { title: "Family Quotes | Family Nest" };

export default async function QuotesPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: { user } } = await supabase.auth.getUser();

  const [quotesRes, membersRes, myMemberRes] = await Promise.all([
    supabase
      .from("family_quotes")
      .select("id, quote, said_by, context, date_said, created_at, family_members!said_by(id, name, nickname, color)")
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("family_members")
      .select("id, name, nickname, color")
      .eq("family_id", activeFamilyId)
      .eq("is_remembered", false)
      .order("name"),
    user
      ? supabase.from("family_members").select("id, role").eq("user_id", user.id).eq("family_id", activeFamilyId).single()
      : Promise.resolve({ data: null }),
  ]);

  type MemberJoin = { id: string; name: string; nickname: string | null; color: string | null } | { id: string; name: string; nickname: string | null; color: string | null }[] | null;

  const rawQuotes = (quotesRes.data ?? []) as { id: string; quote: string; said_by: string | null; context: string | null; date_said: string | null; created_at: string; family_members: MemberJoin }[];

  const quotes = rawQuotes.map(q => {
    const m = Array.isArray(q.family_members) ? q.family_members[0] : q.family_members;
    return {
      id: q.id,
      quote: q.quote,
      said_by: q.said_by,
      context: q.context,
      date_said: q.date_said,
      created_at: q.created_at,
      saidByMember: m ?? null,
    };
  });

  const members = membersRes.data ?? [];
  const myMemberId = myMemberRes.data?.id ?? null;
  const myRole = myMemberRes.data?.role ?? "teen";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-2">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Family Quotes</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          The things your family actually said. Kids say the wildest things — write them down.
        </p>
      </div>
      <QuotesFeed
        quotes={quotes}
        members={members}
        myMemberId={myMemberId}
        myRole={myRole}
      />
    </div>
  );
}
