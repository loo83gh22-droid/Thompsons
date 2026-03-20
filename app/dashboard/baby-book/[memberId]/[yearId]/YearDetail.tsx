"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteBabyBookYear, deleteBabyBookPhoto } from "../../actions";
import { BabyBookForm } from "../BabyBookForm";

type Photo = { id: string; url: string; sort_order: number };

type Entry = {
  id: string;
  year: number;
  note: string | null;
  created_at: string;
  baby_book_photos: Photo[] | null;
};

export function YearDetail({
  entry,
  memberId,
  memberName,
  birthDate,
  existingYears,
}: {
  entry: Entry;
  memberId: string;
  memberName: string;
  birthDate: string | null;
  existingYears: number[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [photos, setPhotos] = useState<Photo[]>(
    [...(entry.baby_book_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  );

  const age = birthDate ? entry.year - new Date(birthDate).getFullYear() : null;

  async function handleDeletePhoto(photoId: string) {
    const result = await deleteBabyBookPhoto(photoId, entry.id, memberId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBabyBookYear(entry.id, memberId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.push(`/dashboard/baby-book/${memberId}`);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Edit {entry.year}</h2>
          <button
            onClick={() => setEditing(false)}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
        </div>
        <BabyBookForm
          memberId={memberId}
          memberName={memberName}
          birthDate={birthDate}
          existingYears={existingYears}
          yearId={entry.id}
          initialYear={entry.year}
          initialNote={entry.note ?? ""}
          existingPhotos={photos}
          onDeletePhoto={handleDeletePhoto}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Photos */}
      {photos.length > 0 && (
        <div className={`grid gap-3 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightboxPhoto(photo.url)}
              className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
              style={{ aspectRatio: photos.length === 1 ? "4/3" : "1/1" }}
            >
              <Image
                src={photo.url}
                alt={`${memberName}, ${entry.year}`}
                fill
                unoptimized
                className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </button>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="flex aspect-[4/3] max-h-80 items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] text-6xl">
          👶
        </div>
      )}

      {/* Details card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">
              {entry.year}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
              {age != null && (
                <span>{age === 0 ? "Newborn" : `Age ${age}`}</span>
              )}
              <span>{photos.length} of 5 photos</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setEditing(true)}
              className="min-h-[36px] rounded-full border border-[var(--border)] px-4 py-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              Edit
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="min-h-[36px] rounded-full border border-red-200 px-4 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-50"
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--muted)]">Sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="min-h-[36px] rounded-full bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
                >
                  {isPending ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-[36px] rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {entry.note && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
            {entry.note}
          </p>
        )}

        <div className="mt-4 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
          <Link href={`/dashboard/baby-book/${memberId}`} className="hover:text-[var(--foreground)]">
            ← Back to {memberName}&apos;s baby book
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute right-4 top-4 text-white/70 hover:text-white text-2xl"
            onClick={() => setLightboxPhoto(null)}
            aria-label="Close"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxPhoto}
            alt={`${memberName}, ${entry.year}`}
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
