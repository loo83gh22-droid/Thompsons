import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { CategoryView } from "../CategoryView";
import Link from "next/link";

const CATEGORIES: Record<string, { label: string; icon: string }> = {
  books: { label: "Books", icon: "📚" },
  movies: { label: "Movies", icon: "🎬" },
  shows: { label: "Shows", icon: "📺" },
  music: { label: "Music", icon: "🎵" },
  toys: { label: "Toys", icon: "🧸" },
  games: { label: "Games", icon: "🎮" },
};

export const metadata = { title: "Favourites | Family Nest" };

export default async function FavouriteCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  const cat = CATEGORIES[category];
  if (!cat) notFound();

  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  // Fetch all family members
  const { data: familyMembers } = await supabase
    .from("family_members")
    .select("id, name")
    .eq("family_id", activeFamilyId)
    .order("name");

  const members = familyMembers || [];

  if (!members.length) {
    return (
      <div>
        <div className="mb-8">
          <Link
            href="/dashboard/favourites"
            className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            ← Favourites
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold text-[var(--foreground)]">
            <span className="mr-2">{cat.icon}</span>
            {cat.label}
          </h1>
        </div>
        <p className="text-[var(--muted)]">No family members found.</p>
      </div>
    );
  }

  // Fetch ALL active favourites for this category (all members at once)
  const { data: activeItems } = await supabase
    .from("favourites")
    .select("id, title, description, notes, age, photo_url, created_at, member_id")
    .eq("family_id", activeFamilyId)
    .eq("category", category)
    .is("removed_at", null)
    .order("created_at", { ascending: false });

  // Fetch ALL history for this category (all members)
  const { data: historyItems } = await supabase
    .from("favourites")
    .select("id, title, description, created_at, removed_at, member_id")
    .eq("family_id", activeFamilyId)
    .eq("category", category)
    .not("removed_at", "is", null)
    .order("removed_at", { ascending: false });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/favourites"
          className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          ← Favourites
        </Link>
        <h1 className="mt-2 font-display text-4xl font-bold text-[var(--foreground)]">
          <span className="mr-2">{cat.icon}</span>
          {cat.label}
        </h1>
      </div>

      <CategoryView
        members={members}
        items={activeItems || []}
        historyItems={historyItems || []}
        category={category}
        categoryLabel={cat.label}
      />
    </div>
  );
}
