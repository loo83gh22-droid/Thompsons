"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createArtworkPiece, updateArtworkPiece } from "../actions";

const MEDIUMS = [
  { value: "", label: "— Select medium —" },
  { value: "drawing", label: "Drawing" },
  { value: "painting", label: "Painting" },
  { value: "craft", label: "Craft" },
  { value: "sculpture", label: "Sculpture" },
  { value: "digital", label: "Digital" },
  { value: "other", label: "Other" },
];

type ExistingPhoto = { id: string; url: string; sort_order: number };

type Props = {
  memberId: string;
  memberName: string;
  birthDate: string | null;
  // Edit mode
  pieceId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialMedium?: string;
  initialDateCreated?: string;
  initialAgeWhenCreated?: number | null;
  existingPhotos?: ExistingPhoto[];
  onDeletePhoto?: (photoId: string) => Promise<void>;
};

function calcAge(birthDate: string, dateCreated: string): number | null {
  try {
    const birth = new Date(birthDate);
    const created = new Date(dateCreated);
    let age = created.getFullYear() - birth.getFullYear();
    const m = created.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && created.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : null;
  } catch {
    return null;
  }
}

export function ArtworkForm({
  memberId,
  memberName,
  birthDate,
  pieceId,
  initialTitle = "",
  initialDescription = "",
  initialMedium = "",
  initialDateCreated = "",
  initialAgeWhenCreated = null,
  existingPhotos = [],
  onDeletePhoto,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [medium, setMedium] = useState(initialMedium);
  const [dateCreated, setDateCreated] = useState(initialDateCreated);
  const [ageDisplay, setAgeDisplay] = useState<number | null>(
    initialAgeWhenCreated ?? (birthDate && initialDateCreated ? calcAge(birthDate, initialDateCreated) : null)
  );
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  function handleDateChange(value: string) {
    setDateCreated(value);
    if (birthDate && value) {
      setAgeDisplay(calcAge(birthDate, value));
    } else {
      setAgeDisplay(null);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const totalExisting = existingPhotos.length + selectedFiles.length;
    const remaining = Math.max(0, 5 - totalExisting);
    const toAdd = files.slice(0, remaining);
    setSelectedFiles((prev) => [...prev, ...toAdd]);
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  }

  function removeNewPhoto(index: number) {
    URL.revokeObjectURL(previews[index]);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleDeleteExisting(photoId: string) {
    if (!onDeletePhoto) return;
    setDeletingPhotoId(photoId);
    try {
      await onDeletePhoto(photoId);
    } finally {
      setDeletingPhotoId(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set("family_member_id", memberId);
    fd.set("title", title);
    fd.set("description", description);
    fd.set("medium", medium);
    fd.set("date_created", dateCreated);
    if (ageDisplay != null) fd.set("age_when_created", String(ageDisplay));
    for (const file of selectedFiles) fd.append("photos", file);

    startTransition(async () => {
      const result = pieceId
        ? await updateArtworkPiece(pieceId, fd)
        : await createArtworkPiece(fd);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/dashboard/artwork/${memberId}/${result.id}`);
      router.refresh();
    });
  }

  const totalPhotos = existingPhotos.length + selectedFiles.length;
  const canAddMore = totalPhotos < 5;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-6 sm:px-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* Photos */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          Photos <span className="text-[var(--muted)]">(up to 5)</span>
        </label>

        <div className="flex flex-wrap gap-3">
          {/* Existing photos */}
          {existingPhotos.map((photo) => (
            <div key={photo.id} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-[var(--border)]">
              <Image
                src={photo.url}
                alt="Artwork photo"
                fill
                unoptimized
                className="object-cover"
                sizes="96px"
              />
              {onDeletePhoto && (
                <button
                  type="button"
                  onClick={() => handleDeleteExisting(photo.id)}
                  disabled={deletingPhotoId === photo.id}
                  className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {deletingPhotoId === photo.id ? "…" : "✕"}
                </button>
              )}
            </div>
          ))}

          {/* New photo previews */}
          {previews.map((src, i) => (
            <div key={src} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-[var(--border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeNewPhoto(i)}
                className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Add photo button */}
          {canAddMore && (
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
              <span className="text-2xl">+</span>
              <span className="text-xs">Photo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="artwork-title" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="artwork-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`e.g. "Rainbow Horse", "My Family", "Spider-Man"`}
          className="input-base w-full"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="artwork-desc" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
          Description <span className="text-[var(--muted)] font-normal text-xs">(optional)</span>
        </label>
        <textarea
          id="artwork-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`What ${memberName} said about it, the story behind it, or anything you want to remember…`}
          className="input-base w-full resize-y"
        />
      </div>

      {/* Medium + Date row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="artwork-medium" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            Medium
          </label>
          <select
            id="artwork-medium"
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
            className="input-base w-full"
          >
            {MEDIUMS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="artwork-date" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            Date created
          </label>
          <input
            id="artwork-date"
            type="date"
            value={dateCreated}
            onChange={(e) => handleDateChange(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="input-base w-full"
          />
          {ageDisplay != null && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              {memberName} was {ageDisplay} years old
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="min-h-[44px] rounded-full bg-[var(--primary)] px-6 py-2.5 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : pieceId ? "Save changes" : "Save artwork"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="min-h-[44px] rounded-full border border-[var(--border)] px-5 py-2.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
