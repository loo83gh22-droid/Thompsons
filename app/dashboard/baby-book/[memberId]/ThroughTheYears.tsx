"use client";

import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "../../components/EmptyState";

type BabyBookPhoto = { id: string; url: string; sort_order: number };

type BabyBookYear = {
  id: string;
  year: number;
  note: string | null;
  created_at: string;
  baby_book_photos: BabyBookPhoto[] | null;
};

function calcAge(birthDate: string, year: number): number | null {
  try {
    const birthYear = new Date(birthDate).getFullYear();
    const age = year - birthYear;
    return age >= 0 ? age : null;
  } catch {
    return null;
  }
}

export function ThroughTheYears({
  years,
  memberId,
  memberName,
  birthDate,
}: {
  years: BabyBookYear[];
  memberId: string;
  memberName: string;
  birthDate: string | null;
}) {
  if (years.length === 0) {
    return (
      <EmptyState
        icon="👶"
        headline={`No years yet for ${memberName}`}
        description="Add the first year to start building their baby book — five photos per year, one year at a time."
        actionLabel="+ Add first year"
        actionHref={`/dashboard/baby-book/${memberId}/new`}
      />
    );
  }

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div
        className="absolute left-6 top-0 bottom-0 w-px sm:left-10"
        style={{ backgroundColor: "var(--border)" }}
      />

      <div className="space-y-8">
        {years.map((entry) => {
          const photos = [...(entry.baby_book_photos ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order
          );
          const age = birthDate ? calcAge(birthDate, entry.year) : null;

          return (
            <Link
              key={entry.id}
              href={`/dashboard/baby-book/${memberId}/${entry.id}`}
              className="group relative flex gap-4 sm:gap-6"
            >
              {/* Year marker */}
              <div className="relative z-10 flex shrink-0 flex-col items-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold sm:h-20 sm:w-20 sm:text-base"
                  style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--accent)",
                    color: "var(--accent)",
                  }}
                >
                  {entry.year}
                </div>
                {age != null && (
                  <span className="mt-1 text-[10px] font-medium text-[var(--muted)] sm:text-xs">
                    {age === 0 ? "Newborn" : age === 1 ? "1 year" : `${age} years`}
                  </span>
                )}
              </div>

              {/* Content card */}
              <div className="flex-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition-shadow group-hover:shadow-md">
                {photos.length > 0 ? (
                  <div className="flex gap-1 overflow-hidden">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative aspect-square flex-1 min-w-0 bg-[var(--surface)]">
                        <Image
                          src={photo.url}
                          alt={`${memberName}, ${entry.year}`}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          sizes="(max-width: 640px) 20vw, 15vw"
                        />
                      </div>
                    ))}
                    {/* Empty photo slots */}
                    {Array.from({ length: 5 - photos.length }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="flex aspect-square flex-1 min-w-0 items-center justify-center bg-[var(--surface)]"
                      >
                        <span className="text-xs text-[var(--muted)] opacity-40">+</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-24 items-center justify-center bg-[var(--surface)] text-sm text-[var(--muted)]">
                    No photos yet — tap to add
                  </div>
                )}
                {entry.note && (
                  <div className="px-4 py-3">
                    <p className="line-clamp-2 text-sm text-[var(--foreground)]">{entry.note}</p>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
