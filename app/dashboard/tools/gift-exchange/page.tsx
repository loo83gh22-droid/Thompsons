import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { GiftExchangeClient } from "./GiftExchangeClient";

export const metadata = { title: "Gift Exchange | Family Nest" };

export default async function GiftExchangePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  // Current member
  const { data: currentMember } = await supabase
    .from("family_members")
    .select("id, name, role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!currentMember) return null;

  // All family members (for adding participants)
  const { data: familyMembers } = await supabase
    .from("family_members")
    .select("id, name, nickname")
    .eq("family_id", activeFamilyId)
    .order("name");

  // All gift exchanges for this family
  const { data: exchanges } = await supabase
    .from("gift_exchanges")
    .select(
      `
      id, name, description, budget_limit, exchange_date, status,
      created_by, created_at, updated_at
    `
    )
    .eq("family_id", activeFamilyId)
    .order("created_at", { ascending: false });

  const exchangeIds = (exchanges ?? []).map((e) => e.id);

  // Participants for all exchanges
  const { data: participants } = exchangeIds.length
    ? await supabase
        .from("gift_exchange_participants")
        .select("id, exchange_id, member_id, assigned_to")
        .in("exchange_id", exchangeIds)
    : { data: [] };

  // Wishlist items for all exchanges
  const { data: wishlistItems } = exchangeIds.length
    ? await supabase
        .from("gift_exchange_wishlist_items")
        .select("id, exchange_id, member_id, item_name, item_url, notes, created_at")
        .in("exchange_id", exchangeIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  return (
    <GiftExchangeClient
      currentMember={currentMember}
      familyMembers={familyMembers ?? []}
      exchanges={exchanges ?? []}
      participants={participants ?? []}
      wishlistItems={wishlistItems ?? []}
    />
  );
}
