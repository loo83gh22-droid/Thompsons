"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { removePet } from "./actions";
import { EmptyStateGuide } from "@/app/components/EmptyStateGuide";
import { EditPetForm, type EditablePet } from "./EditPetForm";
import { toast } from "sonner";

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

// Accent colour per species — used for the top border bar and no-photo background
const SPECIES_COLORS: Record<string, string> = {
  dog:     "#f59e0b",
  cat:     "#8b5cf6",
  bird:    "#38bdf8",
  fish:    "#14b8a6",
  rabbit:  "#ec4899",
  hamster: "#f97316",
  reptile: "#22c55e",
  other:   "#64748b",
};

type PetPhoto = { id: string; url: string; sort_order: number };
type PetOwner = { member_id: string; member: { name: string } | null };

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthday: string | null;
  adopted_date: string | null;
  has_passed: boolean;
  passed_date: string | null;
  description: string | null;
  pet_owners: PetOwner[];
  pet_photos: PetPhoto[];
};

function formatDate(d: string | null) {
  if (!d) return null;
  // Full ISO date YYYY-MM-DD (from old date column or user input)
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-AU", {
      day: "numeric", month: "long", year: "numeric",
    });
  }
  // Year + month YYYY-MM
  if (/^\d{4}-\d{2}$/.test(d)) {
    return new Date(d + "-01T00:00:00").toLocaleDateString("en-AU", {
      month: "long", year: "numeric",
    });
  }
  // Anything else (year only, free text) — display as-is
  return d;
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
  // Use first names only to keep the label compact
  const names = owners
    .map((o) => o.member?.name?.split(" ")[0])
    .filter((n): n is string => !!n);
  if (names.length === 0) return "Everyone's pet";
  if (names.length === 1) return `${names[0]}'s pet`;
  if (names.length === 2) return `${names[0]} & ${names[1]}'s pet`;
  // Cap visible names at 3, show "+N more" for the rest
  const visible = names.slice(0, 3);
  const extra = names.length - 3;
  const base = `${visible.slice(0, -1).join(", ")} & ${visible[visible.length - 1]}`;
  return extra > 0 ? `${base} +${extra} · pet` : `${base}'s pet`;
}

export function PetList({ pets }: { pets: Pet[] }) {
  const router = useRouter();
  const [deletingId,    setDeletingId]    = useState<string | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [editingPet,    setEditingPet]    = useState<Pet | null>(null);

  function handleDelete(id: string, name: string) {
    toast(`Remove ${name} from your pet profiles?`, {
      action: {
        label: "Remove",
        onClick: async () => {
          setDeletingId(id);
          try {
            await removePet(id);
            router.refresh();
          } finally {
            setDeletingId(null);
          }
        },
      },
      cancel: { label: "Cancel" },
      duration: 8000,
    });
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

  const current    = pets.filter((p) => !p.has_passed);
  const remembered = pets.filter((p) => p.has_passed);

  return (
    <>
      {/* Edit modal */}
      {editingPet && (
        <EditPetForm
          pet={editingPet as EditablePet}
          onClose={() => setEditingPet(null)}
        />
      )}

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
                onEdit={setEditingPet}
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
                onEdit={setEditingPet}
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
  onEdit,
  onPhotoClick,
  inMemory = false,
}: {
  pet: Pet;
  deletingId: string | null;
  onDelete: (id: string, name: string) => void;
  onEdit: (pet: Pet) => void;
  onPhotoClick: (url: string) => void;
  inMemory?: boolean;
}) {
  const emoji  = SPECIES_EMOJI[pet.species] ?? "🐾";
  const color  = SPECIES_COLORS[pet.species] ?? "#64748b";
  const photos = [...pet.pet_photos].sort((a, b) => a.sort_order - b.sort_order);
  const age    = petAge(pet.birthday, pet.passed_date);
  const label  = ownerLabel(pet.pet_owners);

  return (
    <article
      className={`rounded-xl border bg-[var(--surface)] overflow-hidden flex flex-col shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        inMemory ? "border-[var(--border)] grayscale-[30%] opacity-85" : "border-[var(--border)]"
      }`}
    >
      {/* Photo */}
      {photos.length > 0 ? (
        <>
          {/* Species colour accent bar above photo */}
          <div style={{ backgroundColor: color }} className="h-[3px] w-full flex-shrink-0" />
          <div
            className="relative h-72 w-full cursor-pointer overflow-hidden bg-[var(--background)]"
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
        </>
      ) : (
        /* No-photo placeholder — tinted gradient in the species colour */
        <div
          className="flex h-40 items-center justify-center text-6xl"
          style={{
            background: `linear-gradient(135deg, ${color}22 0%, ${color}10 100%)`,
            borderBottom: `1px solid ${color}30`,
          }}
        >
          {emoji}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-[var(--foreground)] truncate">
              {photos.length === 0 && <span className="mr-1">{emoji}</span>}
              {pet.name}
            </h3>
            <p className="text-xs text-[var(--muted)]">
              {[pet.breed, pet.species !== "other"
                ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1)
                : "Other"
              ].filter(Boolean).join(" · ")}
            </p>
          </div>
          {/* Actions */}
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(pet)}
              className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(pet.id, pet.name)}
              disabled={deletingId === pet.id}
              className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {deletingId === pet.id ? "..." : "Remove"}
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--muted)]">
          <span>👤 {label}</span>
          {pet.birthday && (
            <span>🎂 {formatDate(pet.birthday)}{age ? ` (${age})` : ""}</span>
          )}
          {pet.adopted_date && (
            <span>🏠 {formatDate(pet.adopted_date)}</span>
          )}
          {pet.passed_date && (
            <span>🌈 {formatDate(pet.passed_date)}</span>
          )}
        </div>

        {pet.description && (
          <p className="mt-2 text-xs text-[var(--foreground)]/75 leading-relaxed line-clamp-3">
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
