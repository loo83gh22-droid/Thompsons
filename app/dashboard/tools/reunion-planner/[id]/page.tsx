import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { notFound } from "next/navigation";
import { ReunionDetailClient } from "./ReunionDetailClient";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("reunions").select("title").eq("id", id).single();
  return { title: data ? `${data.title} | Family Nest` : "Reunion | Family Nest" };
}

export default async function ReunionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const [currentMemberRes, reunionRes, allMembersRes, rsvpsRes] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, name, nickname, role")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single(),
    supabase
      .from("reunions")
      .select(`
        id, title, description, location_name, location_lat, location_lng,
        start_date, end_date, status, created_by, created_at,
        created_by_member:family_members!created_by(id, name, nickname)
      `)
      .eq("id", id)
      .eq("family_id", activeFamilyId)
      .single(),
    supabase
      .from("family_members")
      .select("id, name, nickname, role")
      .eq("family_id", activeFamilyId)
      .order("name"),
    supabase
      .from("reunion_rsvps")
      .select("id, reunion_id, member_id, status, plus_ones, dietary_notes, notes, responded_at")
      .eq("reunion_id", id),
  ]);

  const currentMember = currentMemberRes.data;
  if (!currentMember) return null;

  const reunion = reunionRes.data;
  if (!reunion) notFound();

  const normalizedReunion = {
    ...reunion,
    created_by_member: Array.isArray(reunion.created_by_member)
      ? (reunion.created_by_member[0] ?? null)
      : (reunion.created_by_member ?? null),
  };

  return (
    <ReunionDetailClient
      reunion={normalizedReunion}
      currentMember={currentMember}
      allMembers={allMembersRes.data ?? []}
      rsvps={rsvpsRes.data ?? []}
    />
  );
}
