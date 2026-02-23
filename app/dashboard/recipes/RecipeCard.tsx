"use client";

import Link from "next/link";
import Image from "next/image";

type Recipe = {
  id: string;
  title: string;
  story: string | null;
  occasions: string | null;
  taught_by: string | null;
  taught_by_member: { name: string } | { name: string }[] | null;
  recipe_photo_links: { journal_photos: { id: string; url: string } | { id: string; url: string }[] }[] | null;
};

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const taughtBy = Array.isArray(recipe.taught_by_member)
    ? recipe.taught_by_member[0]
    : recipe.taught_by_member;
  const firstLink = recipe.recipe_photo_links?.[0];
  const photo = firstLink?.journal_photos;
  const photoData = Array.isArray(photo) ? photo[0] : photo;
  const photoUrl = photoData?.url;

  return (
    <Link
      href={`/dashboard/recipes/${recipe.id}`}
      className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all hover:border-[var(--accent)]/40"
    >
      <div className="flex">
        {photoUrl && (
          <div className="relative h-32 w-32 flex-shrink-0">
            <Image
              src={photoUrl}
              alt={`Photo for ${recipe.title}`}
              fill
              unoptimized
              className="object-cover"
              sizes="128px"
            />
          </div>
        )}
        <div className="flex-1 p-4 min-w-0">
          <h3 className="font-display font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">
            {recipe.title}
          </h3>
          {recipe.story && (
            <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
              {recipe.story}
            </p>
          )}
          {(taughtBy?.name || recipe.occasions) && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              {[taughtBy?.name && `From ${taughtBy.name}`, recipe.occasions]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
