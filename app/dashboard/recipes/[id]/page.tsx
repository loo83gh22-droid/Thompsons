import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { DeleteRecipeButton } from "../DeleteRecipeButton";
import { RecipeShareButton } from "../RecipeShareButton";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select(`
      id,
      title,
      story,
      occasions,
      ingredients,
      instructions,
      is_public,
      share_token,
      taught_by_member:family_members!taught_by(name),
      added_by_member:family_members!added_by(name),
      recipe_photo_links(journal_photos(id, url, caption, journal_entries(title, trip_date)))
    `)
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  if (error || !recipe) notFound();

  const taughtBy = Array.isArray(recipe.taught_by_member)
    ? recipe.taught_by_member[0]
    : recipe.taught_by_member;
  const addedBy = Array.isArray(recipe.added_by_member)
    ? recipe.added_by_member[0]
    : recipe.added_by_member;
  const links = (recipe.recipe_photo_links || []) as unknown as {
    journal_photos: { id: string; url: string; caption: string | null; journal_entries: { title: string; trip_date: string | null } | null } | { id: string; url: string; caption: string | null; journal_entries: { title: string; trip_date: string | null } | null }[];
  }[];

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/recipes"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Recipes
        </Link>
      </div>

      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
                {recipe.title}
              </h1>
              {(taughtBy?.name || recipe.occasions) && (
                <p className="mt-2 text-[var(--muted)]">
                  {[taughtBy?.name && `Learned from ${taughtBy.name}`, recipe.occasions]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {addedBy?.name && (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Added by {addedBy.name}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/dashboard/recipes/${id}/edit`}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-hover)]"
              >
                Edit
              </Link>
              <DeleteRecipeButton recipeId={id} />
            </div>
          </div>

          {recipe.story && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-[var(--muted)] mb-2">
                The story
              </h2>
              <div className="whitespace-pre-wrap text-[var(--foreground)]">
                {recipe.story}
              </div>
            </div>
          )}

          {links.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-[var(--muted)] mb-2">
                Photos from dinners
              </h2>
              <div className="flex flex-wrap gap-3">
                {links.map((link) => {
                  const photo = Array.isArray(link.journal_photos)
                    ? link.journal_photos[0]
                    : link.journal_photos;
                  if (!photo) return null;
                  const entry = Array.isArray(photo.journal_entries)
                    ? photo.journal_entries[0]
                    : photo.journal_entries;
                  return (
                    <div
                      key={photo.id}
                      className="relative h-40 w-40 overflow-hidden rounded-lg border border-[var(--border)]"
                    >
                      <Image
                        src={photo.url}
                        alt={photo.caption || entry?.title || "Recipe photo"}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="160px"
                      />
                      {entry?.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white">
                          {entry.title}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {recipe.ingredients && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-[var(--muted)] mb-2">
                Ingredients
              </h2>
              <div className="whitespace-pre-wrap text-[var(--foreground)]">
                {recipe.ingredients}
              </div>
            </div>
          )}

          {recipe.instructions && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-[var(--muted)] mb-2">
                Instructions
              </h2>
              <div className="whitespace-pre-wrap text-[var(--foreground)]">
                {recipe.instructions}
              </div>
            </div>
          )}
        </div>

        {/* Share to social media */}
        <div className="border-t border-[var(--border)] p-6">
          <RecipeShareButton
            recipeId={recipe.id}
            title={recipe.title}
            isPublic={recipe.is_public ?? false}
            shareToken={recipe.share_token ?? null}
          />
        </div>
      </article>
    </div>
  );
}
