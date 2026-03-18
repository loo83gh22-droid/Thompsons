import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { notFound } from "next/navigation";
import { TripDetailClient } from "./TripDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("name")
    .eq("id", id)
    .single();

  return { title: trip ? `${trip.name} | Family Nest` : "Trip | Family Nest" };
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const [memberRes, tripRes] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, name, role")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single(),
    supabase
      .from("trips")
      .select("*")
      .eq("id", id)
      .eq("family_id", activeFamilyId)
      .single(),
  ]);

  const currentMember = memberRes.data;
  const trip = tripRes.data;

  if (!currentMember || !trip) return notFound();

  // Fetch family members, itinerary items, and packing items
  const [familyMembersRes, itineraryRes, packingRes] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, name, nickname")
      .eq("family_id", activeFamilyId)
      .order("name"),
    supabase
      .from("trip_itinerary_items")
      .select("*")
      .eq("trip_id", id)
      .order("day_date")
      .order("sort_order"),
    supabase
      .from("trip_packing_items")
      .select("*, assigned_member:family_members!assigned_to(id, name, nickname)")
      .eq("trip_id", id)
      .order("category")
      .order("item_name"),
  ]);

  const packingItems = (packingRes.data ?? []).map((p) => ({
    ...p,
    assigned_member: Array.isArray(p.assigned_member)
      ? p.assigned_member[0] ?? null
      : p.assigned_member ?? null,
  }));

  return (
    <TripDetailClient
      trip={trip}
      currentMember={currentMember}
      familyMembers={familyMembersRes.data ?? []}
      itineraryItems={itineraryRes.data ?? []}
      packingItems={packingItems}
    />
  );
}
