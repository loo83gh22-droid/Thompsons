import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddMemberForm } from "./AddMemberForm";
import { MemberList } from "./MemberList";

export default async function MembersPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name, nickname, relationship, contact_email, user_id, birth_date, birth_place, avatar_url")
    .eq("family_id", activeFamilyId)
    .order("name");

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Members
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Everyone in your family. Add, edit, or remove members.
          </p>
        </div>
        <AddMemberForm />
      </div>

      {!members?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
            No family members yet
          </h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
            Add your family members to start building your Family Nest. Include parents, kids, grandparents, and anyone who&apos;s part of your story.
          </p>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Use &quot;+ Add member&quot; above to add your first family member.
          </p>
        </div>
      ) : (
        <MemberList members={members} />
      )}
    </div>
  );
}
