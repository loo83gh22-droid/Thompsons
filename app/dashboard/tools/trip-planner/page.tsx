import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { TripPlannerClient } from "./TripPlannerClient";

export const metadata = { title: "Trip Planner | Family Nest" };

export default async function TripPlannerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const [memberRes, tripsRes] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, name, role")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single(),
    supabase
      .from("trips")
      .select(
        `id, name, description, destination, start_date, end_date, status, created_at`
      )
      .eq("family_id", activeFamilyId)
      .order("start_date", { ascending: false }),
  ]);

  const currentMember = memberRes.data;
  if (!currentMember) return null;

  return (
    <TripPlannerClient
      currentMember={currentMember}
      trips={tripsRes.data ?? []}
    />
  );
}
