"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { removeSportsPhoto } from "./actions";

type Photo = {
  id: string;
  url: string;
  title: string | null;
  caption: string | null;
  sport: string | null;
  year: number | null;
};

export function SportsGallery({ photos }: { photos: Photo[] }) {
  const router = useRouter();

  async function handleRemove(id: string) {
    await removeSportsPhoto(id);
    router.refresh();
  }

  if (!photos.length) {
    return (
      <div className="sports-empty rounded-xl border-2 border-dashed border-[var(--sports-border)] py-16 text-center">
        <p className="text-[var(--sports-muted)]">
          No photos yet. Upload your first team photo or action shot!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="sports-trophy-frame group relative overflow-hidden"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-[var(--sports-cream)]">
            <Image
              src={photo.url}
              alt={photo.title || "Sports photo"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          <div className="sports-pennant-label mt-3 px-2">
            <h3 className="font-semibold text-[var(--sports-dark)]">
              {photo.title || "Untitled"}
            </h3>
            {(photo.sport || photo.year) && (
              <p className="mt-0.5 text-xs text-[var(--sports-muted)]">
                {[photo.sport, photo.year].filter(Boolean).join(" · ")}
              </p>
            )}
            {photo.caption && (
              <p className="mt-1 text-sm text-[var(--sports-muted)] line-clamp-2">
                {photo.caption}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleRemove(photo.id)}
            className="absolute right-2 top-2 rounded bg-black/50 px-2 py-1 text-xs text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
