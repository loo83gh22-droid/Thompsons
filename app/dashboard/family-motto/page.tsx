import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { canManageMembers } from "@/src/lib/roles";
import { MottoClient } from "./MottoClient";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata = { title: "Family Motto & Values | Family Nest" };

export default async function FamilyMottoPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const { data: { user } } = await supabase.auth.getUser();

  const [mottoRes, valuesRes, currentMemberRes] = await Promise.all([
    supabase.from("family_motto").select("motto").eq("family_id", activeFamilyId).maybeSingle(),
    supabase.from("family_values").select("id, value, added_by_member_id").eq("family_id", activeFamilyId).order("created_at"),
    user
      ? supabase.from("family_members").select("id, name, nickname, role").eq("family_id", activeFamilyId).eq("user_id", user.id).maybeSingle()
      : { data: null },
  ]);

  const currentMember = currentMemberRes.data;
  const personalNoteRes = currentMember
    ? await supabase.from("member_motto_notes").select("personal_note").eq("family_member_id", currentMember.id).maybeSingle()
    : { data: null };

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          Family Motto & Values
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          What your family stands for. In your own words.
        </p>
      </div>

      <MottoClient
        motto={mottoRes.data?.motto ?? null}
        values={valuesRes.data ?? []}
        currentMemberId={currentMember?.id ?? null}
        currentMemberName={currentMember?.nickname ?? currentMember?.name ?? null}
        personalNote={personalNoteRes.data?.personal_note ?? null}
        canManage={canManageMembers(currentMember?.role ?? "child")}
      />
    </div>
  );
}
