import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { GratitudeBoardClient } from "./GratitudeBoardClient";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata = { title: "Gratitude Board | Family Nest" };

export default async function GratitudeBoardPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const { data: { user } } = await supabase.auth.getUser();

  const [membersRes, postsRes, currentMemberRes] = await Promise.all([
    supabase.from("family_members").select("id, name, nickname").eq("family_id", activeFamilyId).eq("is_remembered", false).order("name"),
    supabase.from("gratitude_posts").select("id, content, created_at, member_id, family_members!member_id(name, nickname)")
      .eq("family_id", activeFamilyId).order("created_at", { ascending: false }).limit(200),
    user
      ? supabase.from("family_members").select("id").eq("family_id", activeFamilyId).eq("user_id", user.id).maybeSingle()
      : { data: null },
  ]);

  type MemberJoin = { name: string; nickname: string | null } | { name: string; nickname: string | null }[] | null;

  const posts = (postsRes.data ?? []).map((p: { id: string; content: string; created_at: string; member_id: string; family_members: MemberJoin }) => {
    const m = Array.isArray(p.family_members) ? p.family_members[0] : p.family_members;
    return {
      id: p.id,
      content: p.content,
      created_at: p.created_at,
      member_id: p.member_id,
      member_name: m?.nickname ?? m?.name ?? "Unknown",
    };
  });

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          Gratitude Board
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          What are you grateful for today? Small things count.
        </p>
      </div>

      <GratitudeBoardClient
        posts={posts}
        members={membersRes.data ?? []}
        currentMemberId={currentMemberRes.data?.id ?? null}
      />
    </div>
  );
}
