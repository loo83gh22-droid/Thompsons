import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { FavouritesList } from "../FavouritesList";
import { AddFavouriteForm } from "../AddFavouriteForm";
import Link from "next/link";
import type { FavouriteCategory } from "../actions";

const CATEGORIES: Record<string, { label: string; icon: string }> = {
  books: { label: "Books", icon: "📚" },
  movies: { label: "Movies", icon: "🎬" },
  shows: { label: "Shows", icon: "📺" },
  music: { label: "Music", icon: "🎵" },
  podcasts: { label: "Podcasts", icon: "🎙️" },
  games: { label: "Games", icon: "🎮" },
};

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

  const { data: favourites } = await supabase
    .from("favourites")
    .select(`
      id,
      category,
      title,
      description,
      notes,
      sort_order,
      added_by,
      family_members (name)
    `)
    .eq("family_id", activeFamilyId)
    .eq("category", category)
    .order("sort_order");

  const { data: familyMembers } = await supabase
    .from("family_members")
    .select("id, name")
    .eq("family_id", activeFamilyId)
    .order("name");

  return (
    <div>
      <div className="mb-10">
        <div className="mb-2">
          <Link
            href="/dashboard/favourites"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            ← Favourites
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl font-bold text-[var(--foreground)]">
            <span className="mr-2">{cat.icon}</span>
            {cat.label}
          </h1>
          <AddFavouriteForm
            category={category as FavouriteCategory}
            categoryLabel={cat.label}
            familyMembers={familyMembers || []}
          />
        </div>
        <p className="mt-2 text-lg text-[var(--muted)]">
          The stuff we love. Add yours!
        </p>
      </div>

      <FavouritesList
        items={favourites || []}
        familyMembers={familyMembers || []}
      />
    </div>
  );
}
