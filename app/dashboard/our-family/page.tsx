import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { OurFamilyClient } from "./OurFamilyClient";
import { AddMemberForm } from "../members/AddMemberForm";
import type { MemberRole } from "@/src/lib/roles";

export type OurFamilyMember = {
  id: string;
  name: string;
  nickname: string | null;
  relationship: string | null;
  contact_email: string | null;
  user_id: string | null;
  birth_date: string | null;
  birth_place: string | null;
  avatar_url: string | null;
  role: MemberRole;
  kid_access_token: string | null;
  created_at: string;
  is_remembered: boolean;
  passed_date: string | null;
};

export type OurFamilyRelationship = {
  member_id: string;
  related_id: string;
  relationship_type: string;
};

export type MemberActivity = {
  journalCount: number;
  voiceCount: number;
  photoCount: number;
};

export default async function OurFamilyPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const [
    { data: members },
    { data: relationships },
    journalCountsRes,
    voiceCountsRes,
  ] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, name, nickname, relationship, contact_email, user_id, birth_date, birth_place, avatar_url, role, kid_access_token, created_at, is_remembered, passed_date")
      .eq("family_id", activeFamilyId)
      .order("name"),
    supabase
      .from("family_relationships")
      .select("member_id, related_id, relationship_type")
      .eq("family_id", activeFamilyId),
    supabase
      .from("journal_entries")
      .select("author_id")
      .eq("family_id", activeFamilyId),
    supabase
      .from("voice_memos")
      .select("family_member_id")
      .eq("family_id", activeFamilyId),
  ]);

  const activityByMember: Record<string, MemberActivity> = {};
  (members ?? []).forEach((m) => {
    activityByMember[m.id] = { journalCount: 0, voiceCount: 0, photoCount: 0 };
  });
  (journalCountsRes.data ?? []).forEach((r: { author_id: string | null }) => {
    if (r.author_id && activityByMember[r.author_id]) activityByMember[r.author_id].journalCount++;
  });
  (voiceCountsRes.data ?? []).forEach((r: { family_member_id: string | null }) => {
    if (r.family_member_id && activityByMember[r.family_member_id]) activityByMember[r.family_member_id].voiceCount++;
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Our Family
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            See your family connections and manage members
          </p>
        </div>
        <AddMemberForm
          triggerClassName="min-h-[44px] shrink-0 rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          linkMembers={members ?? []}
        />
      </div>

      <OurFamilyClient
        members={(members ?? []) as OurFamilyMember[]}
        relationships={(relationships ?? []) as OurFamilyRelationship[]}
        activityByMember={activityByMember}
      />
    </div>
  );
}
