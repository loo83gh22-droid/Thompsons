import { createClient } from "@/src/lib/supabase/server";
import { AddMemberForm } from "./AddMemberForm";
import { MemberList } from "./MemberList";

export default async function MembersPage() {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name, relationship, contact_email, user_id")
    .order("name");

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
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
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] py-12 text-center text-[var(--muted)]">
          No members yet. Click &quot;Add member&quot; to add someone.
        </p>
      ) : (
        <MemberList members={members} />
      )}
    </div>
  );
}
