import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddRecipeForm } from "./AddRecipeForm";
import { RecipeCard } from "./RecipeCard";
import { RecipesEmptyState } from "./RecipesEmptyState";

export const metadata = { title: "Family Recipes | Family Nest" };

export default async function RecipesPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: recipes } = await supabase
    .from("recipes")
    .select(`
      id,
      title,
      story,
      occasions,
      taught_by,
      taught_by_member:family_members!taught_by(name),
      recipe_photo_links(journal_photos(id, url))
    `)
    .eq("family_id", activeFamilyId)
    .order("sort_order");

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name")
    .eq("family_id", activeFamilyId)
    .order("name");

  const { data: journalPhotos } = await supabase
    .from("journal_photos")
    .select("id, url, caption, journal_entries(title, trip_date)")
    .eq("family_id", activeFamilyId)
    .order("id", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            🍳 Recipes
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            The story behind the food — who taught it, what occasions, photos from dinners.
          </p>
        </div>
        <AddRecipeForm
          members={members || []}
          journalPhotos={(journalPhotos ?? []) as unknown as Parameters<typeof AddRecipeForm>[0]["journalPhotos"]}
        />
      </div>

      {!recipes?.length ? (
        <RecipesEmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe as unknown as Parameters<typeof RecipeCard>[0]["recipe"]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
