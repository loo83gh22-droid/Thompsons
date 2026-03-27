import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { ListDetail } from "./ListDetail";

export const metadata: Metadata = {
  title: "Favourites | Family Nest",
};

type Props = { params: Promise<{ listId: string }> };

export default async function ListPage({ params }: Props) {
  const { listId } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: { user } } = await supabase.auth.getUser();

  const [listRes, itemsRes, membersRes, myMemberRes] = await Promise.all([
    supabase
      .from("favourite_lists")
      .select("id, name, emoji")
      .eq("id", listId)
      .eq("family_id", activeFamilyId)
      .single(),
    supabase
      .from("favourite_items")
      .select("id, title, notes, url, added_by, removed_at, created_at")
      .eq("list_id", listId)
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("family_members")
      .select("id, name, nickname, color")
      .eq("family_id", activeFamilyId)
      .eq("is_remembered", false)
      .order("name"),
    user
      ? supabase
          .from("family_members")
          .select("id, role")
          .eq("user_id", user.id)
          .eq("family_id", activeFamilyId)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  if (!listRes.data) notFound();

  const list = listRes.data;
  const items = itemsRes.data ?? [];
  const members = membersRes.data ?? [];
  const myMemberId = myMemberRes.data?.id ?? null;
  const myRole = myMemberRes.data?.role ?? "teen";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard/favourites" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Favourites
      </Link>

      <ListDetail
        list={list}
        items={items}
        members={members}
        myMemberId={myMemberId}
        myRole={myRole}
        listId={listId}
      />
    </div>
  );
}
