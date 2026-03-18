import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { ReunionListClient } from "./ReunionListClient";

export const metadata = { title: "Reunion Planner | Family Nest" };

export default async function ReunionPlannerPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const [currentMemberRes, reunionsRes] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, name, role")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single(),
    supabase
      .from("reunions")
      .select(`
        id, title, description, location_name, start_date, end_date, status,
        created_by, created_at,
        created_by_member:family_members!created_by(id, name, nickname)
      `)
      .eq("family_id", activeFamilyId)
      .order("start_date", { ascending: false }),
  ]);

  const currentMember = currentMemberRes.data;
  if (!currentMember) return null;

  const reunions = (reunionsRes.data ?? []).map((r) => ({
    ...r,
    created_by_member: Array.isArray(r.created_by_member)
      ? (r.created_by_member[0] ?? null)
      : (r.created_by_member ?? null),
  }));

  // Get RSVP counts for each reunion
  const reunionIds = reunions.map((r) => r.id);
  const { data: rsvps } = reunionIds.length
    ? await supabase
        .from("reunion_rsvps")
        .select("reunion_id, status")
        .in("reunion_id", reunionIds)
    : { data: [] };

  const rsvpCounts: Record<string, { attending: number; maybe: number; declined: number }> = {};
  for (const rsvp of rsvps ?? []) {
    if (!rsvpCounts[rsvp.reunion_id]) {
      rsvpCounts[rsvp.reunion_id] = { attending: 0, maybe: 0, declined: 0 };
    }
    if (rsvp.status === "attending") rsvpCounts[rsvp.reunion_id].attending++;
    else if (rsvp.status === "maybe") rsvpCounts[rsvp.reunion_id].maybe++;
    else if (rsvp.status === "declined") rsvpCounts[rsvp.reunion_id].declined++;
  }

  return (
    <ReunionListClient
      currentMember={currentMember}
      reunions={reunions}
      rsvpCounts={rsvpCounts}
    />
  );
}
