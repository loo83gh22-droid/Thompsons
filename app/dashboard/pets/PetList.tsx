"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { removePet } from "./actions";
import { EmptyStateGuide } from "@/app/components/EmptyStateGuide";

const SPECIES_EMOJI: Record<string, string> = {
  dog:     "🐕",
  cat:     "🐈",
  bird:    "🐦",
  fish:    "🐠",
  rabbit:  "🐇",
  hamster: "🐹",
  reptile: "🦎",
  other:   "🐾",
};

type PetPhoto = { id: string; url: string; sort_order: number };
type PetOwner = { member: { name: string } | null };

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthday: string | null;
  adopted_date: string | null;
  passed_date: string | null;
  description: string | null;
  pet_owners: PetOwner[];
  pet_photos: PetPhoto[];
};

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function petAge(birthday: string | null, passedDate: string | null) {
  if (!birthday) return null;
  const end = passedDate ? new Date(passedDate) : new Date();
  const born = new Date(birthday);
  const years = end.getFullYear() - born.getFullYear();
  const months = end.getMonth() - born.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 2) return "a few months old";
  if (totalMonths < 24) return `${totalMonths} months old`;
  return `${years} year${years !== 1 ? "s" : ""} old`;
}

function ownerLabel(owners: PetOwner[]): string {
  const names = owners
    .map((o) => o.member?.name)
    .filter((n): n is string => !!n);
  if (names.length === 0) return "Everyone's pet";
  if (names.length === 1) return `${names[0]}'s pet`;
  if (names.length === 2) return `${names[0]} & ${names[1]}'s pet`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}'s pet`;
}

export function PetList({ pets }: { pets: Pet[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from your pet profiles?`)) return;
    setDeletingId(id);
    try {
      await removePet(id);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (!pets.length) {
    return (
      <EmptyStateGuide
        icon="🐾"
        title="Your pets deserve a place in the family story."
        description="From loyal dogs to quirky goldfish — every pet leaves paw prints on our hearts. Create a profile for each one so they're never forgotten."
        inspiration={[
          "Your current dog, cat, rabbit, or any fur baby in the family",
          "Beloved pets who've passed — a tribute so they're never forgotten",
          "The fish that somehow survived for a decade",
          "A childhood pet that everyone still talks about",
        ]}
        ctaLabel="+ Add your first pet"
        onAction={() => document.querySelector<HTMLButtonElement>("[data-add-pet]")?.click()}
      />
    );
  }

  const current    = pets.filter((p) => !p.passed_date);
  const remembered = pets.filter((p) => !!p.passed_date);

  return (
    <>
      {/* Lightbox */}
      {expandedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpandedPhoto(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Image
              src={expandedPhoto}
              alt="Pet photo"
              width={900}
              height={700}
              className="rounded-lg object-contain max-h-[90vh]"
              unoptimized
            />
            <button
              onClick={() => setExpandedPhoto(null)}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {current.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-[var(--foreground)]">
            Current Pets
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {current.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                deletingId={deletingId}
                onDelete={handleDelete}
                onPhotoClick={setExpandedPhoto}
              />
            ))}
          </div>
        </section>
      )}

      {remembered.length > 0 && (
        <section className={current.length > 0 ? "mt-10" : ""}>
          <h2 className="mb-4 font-display text-xl font-semibold text-[var(--muted)]">
            🌈 In Memory
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {remembered.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                deletingId={deletingId}
                onDelete={handleDelete}
                onPhotoClick={setExpandedPhoto}
                inMemory
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function PetCard({
  pet,
  deletingId,
  onDelete,
  onPhotoClick,
  inMemory = false,
}: {
  pet: Pet;
  deletingId: string | null;
  onDelete: (id: string, name: string) => void;
  onPhotoClick: (url: string) => void;
  inMemory?: boolean;
}) {
  const emoji  = SPECIES_EMOJI[pet.species] ?? "🐾";
  const photos = [...pet.pet_photos].sort((a, b) => a.sort_order - b.sort_order);
  const age    = petAge(pet.birthday, pet.passed_date);
  const label  = ownerLabel(pet.pet_owners);

  return (
    <article
      className={`rounded-xl border bg-[var(--surface)] overflow-hidden flex flex-col ${
        inMemory ? "border-[var(--border)] opacity-80" : "border-[var(--border)]"
      }`}
    >
      {/* Photo */}
      {photos.length > 0 ? (
        <div
          className="relative h-44 w-full cursor-pointer overflow-hidden bg-[var(--background)]"
          onClick={() => onPhotoClick(photos[0].url)}
        >
          <Image
            src={photos[0].url}
            alt={pet.name}
            fill
            className="object-cover transition-transform hover:scale-105"
            unoptimized
          />
          {photos.length > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              +{photos.length - 1} more
            </span>
          )}
          {inMemory && <div className="absolute inset-0 bg-black/20" />}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center bg-[var(--surface-hover)] text-5xl">
          {emoji}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold text-[var(--foreground)] truncate">
              {photos.length === 0 && <span className="mr-1">{emoji}</span>}
              {pet.name}
            </h3>
            <p className="text-sm text-[var(--muted)]">
              {[pet.breed, pet.species !== "other"
                ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1)
                : "Other"
              ].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(pet.id, pet.name)}
            disabled={deletingId === pet.id}
            className="flex-shrink-0 rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {deletingId === pet.id ? "..." : "Remove"}
          </button>
        </div>

        <div className="mt-3 space-y-1 text-xs text-[var(--muted)]">
          <p>👤 {label}</p>
          {pet.birthday && (
            <p>🎂 Born {formatDate(pet.birthday)}{age ? ` (${age})` : ""}</p>
          )}
          {pet.adopted_date && (
            <p>🏠 Joined the family {formatDate(pet.adopted_date)}</p>
          )}
          {pet.passed_date && (
            <p>🌈 Passed {formatDate(pet.passed_date)}</p>
          )}
        </div>

        {pet.description && (
          <p className="mt-3 text-sm text-[var(--foreground)]/80 leading-relaxed line-clamp-4">
            {pet.description}
          </p>
        )}

        {/* Extra photo thumbnails */}
        {photos.length > 1 && (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {photos.slice(1).map((ph) => (
              <button
                key={ph.id}
                type="button"
                onClick={() => onPhotoClick(ph.url)}
                className="relative h-12 w-12 overflow-hidden rounded-md border border-[var(--border)]"
              >
                <Image
                  src={ph.url}
                  alt=""
                  fill
                  className="object-cover hover:scale-110 transition-transform"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
