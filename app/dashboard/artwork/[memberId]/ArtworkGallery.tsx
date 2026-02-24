"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "../../components/EmptyState";

type ArtworkPhoto = { id: string; url: string; sort_order: number };

type ArtworkPiece = {
  id: string;
  title: string;
  description: string | null;
  medium: string | null;
  date_created: string | null;
  age_when_created: number | null;
  created_at: string;
  artwork_photos: ArtworkPhoto[] | null;
};

const MEDIUM_LABELS: Record<string, string> = {
  drawing: "Drawing",
  painting: "Painting",
  craft: "Craft",
  sculpture: "Sculpture",
  digital: "Digital",
  other: "Other",
};

const MEDIUM_COLORS: Record<string, string> = {
  drawing: "bg-blue-100 text-blue-700",
  painting: "bg-purple-100 text-purple-700",
  craft: "bg-yellow-100 text-yellow-700",
  sculpture: "bg-orange-100 text-orange-700",
  digital: "bg-cyan-100 text-cyan-700",
  other: "bg-[var(--surface)] text-[var(--muted)]",
};

export function ArtworkGallery({
  pieces,
  memberId,
  memberName,
}: {
  pieces: ArtworkPiece[];
  memberId: string;
  memberName: string;
}) {
  const [filterMedium, setFilterMedium] = useState<string>("all");

  const mediums = useMemo(() => {
    const set = new Set<string>();
    for (const p of pieces) if (p.medium) set.add(p.medium);
    return Array.from(set);
  }, [pieces]);

  const filtered = useMemo(() => {
    if (filterMedium === "all") return pieces;
    return pieces.filter((p) => p.medium === filterMedium);
  }, [pieces, filterMedium]);

  if (pieces.length === 0) {
    return (
      <EmptyState
        icon="🖼️"
        headline={`No artwork yet for ${memberName}`}
        description="Upload photos of drawings, paintings, crafts, or any creation — and build a portfolio they'll treasure."
        actionLabel="+ Add first piece"
        actionHref={`/dashboard/artwork/${memberId}/new`}
      />
    );
  }

  return (
    <div className="space-y-5">
      {mediums.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMedium("all")}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filterMedium === "all"
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            All
          </button>
          {mediums.map((m) => (
            <button
              key={m}
              onClick={() => setFilterMedium(m)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                filterMedium === m
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {MEDIUM_LABELS[m] ?? m}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((piece) => {
          const photos = [...(piece.artwork_photos ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order
          );
          const cover = photos[0]?.url ?? null;

          return (
            <Link
              key={piece.id}
              href={`/dashboard/artwork/${memberId}/${piece.id}`}
              className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square w-full bg-[var(--surface)]">
                {cover ? (
                  <Image
                    src={cover}
                    alt={piece.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🖼️</div>
                )}
                {piece.medium && (
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                      MEDIUM_COLORS[piece.medium] ?? MEDIUM_COLORS.other
                    }`}
                  >
                    {MEDIUM_LABELS[piece.medium] ?? piece.medium}
                  </span>
                )}
              </div>
              <div className="px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {piece.title}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {piece.age_when_created != null
                    ? `Age ${piece.age_when_created}`
                    : piece.date_created
                    ? new Date(piece.date_created).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                      })
                    : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
