import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { NewListButton } from "./NewListButton";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata: Metadata = {
  title: "Favourites | Family Nest",
};

type ListRow = {
  id: string;
  name: string;
  emoji: string | null;
  sort_order: number;
  created_at: string;
};

type ItemCount = { list_id: string; count: number };
type MemberSnippet = { list_id: string; color: string | null };

export default async function FavouritesPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const { data: lists } = await supabase
    .from("favourite_lists")
    .select("id, name, emoji, sort_order, created_at")
    .eq("family_id", activeFamilyId)
    .order("sort_order")
    .order("created_at");

  const listIds = (lists ?? []).map((l) => l.id);

  // Batch fetch item counts and member colors per list
  const [itemsRes, membersRes] = await Promise.all([
    listIds.length > 0
      ? supabase
          .from("favourite_items")
          .select("list_id")
          .in("list_id", listIds)
          .is("removed_at", null)
      : Promise.resolve({ data: [] }),
    listIds.length > 0
      ? supabase
          .from("favourite_items")
          .select("list_id, family_members!added_by(color)")
          .in("list_id", listIds)
          .is("removed_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  // Count items per list
  const countByList = new Map<string, number>();
  for (const item of (itemsRes.data ?? []) as { list_id: string }[]) {
    countByList.set(item.list_id, (countByList.get(item.list_id) ?? 0) + 1);
  }

  // Collect unique member colors per list (up to 4 for avatar stack)
  const colorsByList = new Map<string, string[]>();
  for (const row of (membersRes.data ?? []) as unknown as MemberSnippet[]) {
    if (!colorsByList.has(row.list_id)) colorsByList.set(row.list_id, []);
    const colors = colorsByList.get(row.list_id)!;
    if (row.color && !colors.includes(row.color) && colors.length < 4) {
      colors.push(row.color);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Favourites</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Shared family lists — books, films, music, and anything else worth remembering.
          </p>
        </div>
        <NewListButton />
      </div>

      {/* Empty state */}
      {(!lists || lists.length === 0) && (
        <div className="mt-20 text-center">
          <div className="text-5xl">⭐</div>
          <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">No lists yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Create your first list — Films & Shows, Books, Board Games, anything your family loves.
          </p>
          <div className="mt-6 flex justify-center">
            <NewListButton primary />
          </div>
        </div>
      )}

      {/* Lists grid */}
      {lists && lists.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(lists as ListRow[]).map((list) => {
            const count = countByList.get(list.id) ?? 0;
            const colors = colorsByList.get(list.id) ?? [];
            return (
              <Link
                key={list.id}
                href={`/dashboard/favourites/${list.id}`}
                className="group flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)] hover:shadow-sm"
              >
                {/* Emoji + name */}
                <div className="flex items-center gap-3">
                  {list.emoji ? (
                    <span className="text-3xl leading-none">{list.emoji}</span>
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface)] text-xl">
                      ⭐
                    </span>
                  )}
                  <h2 className="font-display text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">
                    {list.name}
                  </h2>
                </div>

                {/* Footer: count + member dots */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted)]">
                    {count} {count === 1 ? "item" : "items"}
                  </span>
                  {colors.length > 0 && (
                    <div className="flex -space-x-1.5">
                      {colors.map((color, i) => (
                        <span
                          key={i}
                          className="h-5 w-5 rounded-full ring-2 ring-[var(--card)]"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}

          {/* + New list card */}
          <NewListButton asCard />
        </div>
      )}
    </div>
  );
}
