import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { OurFamilyClient } from "./OurFamilyClient";
import { AddMemberForm } from "../members/AddMemberForm";
import type { MemberRole } from "@/src/lib/roles";
import Link from "next/link";

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

  // Load current user's member record for alias lookups
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: currentMember } = user
    ? await supabase
        .from("family_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("family_id", activeFamilyId)
        .single()
    : { data: null };

  const [
    { data: members },
    { data: relationships },
    journalCountsRes,
    voiceCountsRes,
    aliasRes,
  ] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, name, nickname, relationship, contact_email, user_id, birth_date, birth_place, avatar_url, role, kid_access_token, created_at")
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
    currentMember
      ? supabase
          .from("member_aliases")
          .select("target_member_id, label")
          .eq("viewer_member_id", currentMember.id)
      : Promise.resolve({ data: [] }),
  ]);

  const aliasMap: Record<string, string> = Object.fromEntries(
    (aliasRes.data ?? []).map((a: { target_member_id: string; label: string }) => [
      a.target_member_id,
      a.label,
    ])
  );
  const hasPersonalized = (aliasRes.data ?? []).length > 0;

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

      {/* Personalize prompt — shown once until the user sets their names */}
      {!hasPersonalized && (members ?? []).length > 1 && (
        <Link
          href="/dashboard/personalize"
          className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-5 py-4 transition-colors hover:bg-[var(--accent)]/10"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Make your Nest personal</p>
              <p className="text-xs text-[var(--muted)]">Set the names you use for each family member — takes 30 seconds</p>
            </div>
          </div>
          <span className="shrink-0 text-sm font-medium text-[var(--accent)]">Personalize →</span>
        </Link>
      )}

      <OurFamilyClient
        members={(members ?? []) as OurFamilyMember[]}
        relationships={(relationships ?? []) as OurFamilyRelationship[]}
        activityByMember={activityByMember}
        aliasMap={aliasMap}
      />
    </div>
  );
}
