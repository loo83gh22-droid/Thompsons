"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { removeAchievement } from "./actions";

type Achievement = {
  id: string;
  what: string;
  achievement_date: string | null;
  location: string | null;
  description: string | null;
  attachment_url: string | null;
  family_members: { name: string } | { name: string }[] | null;
};

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;

function isImageUrl(url: string) {
  try {
    const path = new URL(url).pathname;
    return IMAGE_EXT.test(path);
  } catch {
    return false;
  }
}

export function AchievementsGallery({ achievements }: { achievements: Achievement[] }) {
  const router = useRouter();

  async function handleRemove(id: string) {
    await removeAchievement(id);
    router.refresh();
  }

  if (!achievements.length) {
    return (
      <div className="sports-empty rounded-xl border-2 border-dashed border-[var(--sports-border)] py-16 text-center">
        <p className="text-[var(--sports-muted)]">
          No achievements yet. Add your first one!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {achievements.map((a) => (
        <div
          key={a.id}
          className="sports-trophy-frame group relative overflow-hidden"
        >
          {a.attachment_url && isImageUrl(a.attachment_url) ? (
            <div className="relative aspect-[4/3] overflow-hidden bg-[var(--sports-cream)]">
              <Image
                src={a.attachment_url}
                alt={a.what}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          ) : a.attachment_url ? (
            <div className="flex aspect-[4/3] items-center justify-center bg-[var(--sports-cream)]">
              <a
                href={a.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-[var(--sports-gold)] px-4 py-2 font-medium text-[var(--sports-dark)] hover:bg-[var(--sports-gold-hover)]"
              >
                View document
              </a>
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-[var(--sports-cream)] text-[var(--sports-muted)]">
              No attachment
            </div>
          )}
          <div className="sports-pennant-label mt-3 px-2">
            <h3 className="font-semibold text-[var(--sports-dark)]">
              {a.what}
            </h3>
            {a.family_members && (
              <p className="mt-0.5 text-xs text-[var(--sports-muted)]">
                {(Array.isArray(a.family_members) ? a.family_members[0] : a.family_members)?.name}
              </p>
            )}
            {(a.achievement_date || a.location) && (
              <p className="mt-0.5 text-xs text-[var(--sports-muted)]">
                {[a.achievement_date, a.location].filter(Boolean).join(" · ")}
              </p>
            )}
            {a.description && (
              <p className="mt-1 text-sm text-[var(--sports-muted)] line-clamp-2">
                {a.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleRemove(a.id)}
            className="absolute right-2 top-2 rounded bg-black/50 px-2 py-1 text-xs text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
