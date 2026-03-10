import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { BucketListClient } from "./BucketListClient";

export const metadata = { title: "Bucket List | Family Nest" };

export default async function BucketListPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  // Run independent queries in parallel
  const [currentMemberRes, allMembersRes, itemsRes] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, name, role")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single(),
    supabase
      .from("family_members")
      .select("id, name, nickname, role")
      .eq("family_id", activeFamilyId)
      .order("name"),
    supabase
      .from("bucket_list_items")
      .select(`
        id, title, description, scope, is_private, status,
        category, target_date, completed_at, completed_note,
        sort_order, created_at,
        added_by,
        added_by_member:family_members!added_by(id, name, nickname)
      `)
      .eq("family_id", activeFamilyId)
      .order("status")
      .order("sort_order")
      .order("created_at"),
  ]);

  const currentMember = currentMemberRes.data;
  if (!currentMember) return null;

  const allMembers = allMembersRes.data;
  const items = itemsRes.data;

  // All cheers for this family's items
  const itemIds = (items ?? []).map((i) => i.id);
  const { data: cheers } = itemIds.length
    ? await supabase
        .from("bucket_list_cheers")
        .select("item_id, member_id")
        .in("item_id", itemIds)
    : { data: [] };

  // Supabase returns joined relations as arrays even for single-row joins — normalise to object | null
  const normalisedItems = (items ?? []).map((item) => ({
    ...item,
    added_by_member: Array.isArray(item.added_by_member)
      ? (item.added_by_member[0] ?? null)
      : (item.added_by_member ?? null),
  }));

  return (
    <BucketListClient
      currentMember={currentMember}
      allMembers={allMembers ?? []}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items={normalisedItems as any}
      cheers={cheers ?? []}
    />
  );
}
