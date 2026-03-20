"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/client";
import { createBabyBookYear, updateBabyBookYear } from "../actions";
import type { UploadedFileMeta } from "@/src/lib/uploadedFileMeta";
import { compressImages } from "@/src/lib/compressImage";

type ExistingPhoto = { id: string; url: string; sort_order: number };

type Props = {
  memberId: string;
  memberName: string;
  birthDate: string | null;
  existingYears: number[];
  // Edit mode
  yearId?: string;
  initialYear?: number;
  initialNote?: string;
  existingPhotos?: ExistingPhoto[];
  onDeletePhoto?: (photoId: string) => Promise<void>;
};

export function BabyBookForm({
  memberId,
  memberName,
  birthDate,
  existingYears,
  yearId,
  initialYear,
  initialNote = "",
  existingPhotos = [],
  onDeletePhoto,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();
  const birthYear = birthDate ? new Date(birthDate).getFullYear() : currentYear - 18;

  // Build available years (birth year to current year, excluding already-used years)
  const availableYears: number[] = [];
  for (let y = currentYear; y >= birthYear; y--) {
    if (!existingYears.includes(y) || y === initialYear) {
      availableYears.push(y);
    }
  }

  const [year, setYear] = useState<number>(initialYear ?? availableYears[0] ?? currentYear);
  const [note, setNote] = useState(initialNote);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

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

    startTransition(async () => {
      const supabase = createClient();
      const folderId = yearId ?? crypto.randomUUID();
      setUploadProgress("Compressing photos…");
      const compressed = await compressImages(selectedFiles);
      let done = 0;
      const uploads = compressed.map(async (file) => {
        const ext = file.name.split(".").pop() || "jpg";
        const storagePath = `${folderId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("baby-book-photos")
          .upload(storagePath, file, { upsert: true });
        if (uploadError) {
          console.error("Photo upload failed:", uploadError.message);
          return null;
        }
        done++;
        setUploadProgress(`Uploading… ${done}/${compressed.length}`);
        return { url: `/api/storage/baby-book-photos/${storagePath}`, storagePath, fileSize: file.size };
      });
      const results = await Promise.all(uploads);
      setUploadProgress(null);
      const uploadedMeta = results.filter((r) => r !== null) as UploadedFileMeta[];

      const fd = new FormData();
      fd.set("family_member_id", memberId);
      fd.set("year", String(year));
      fd.set("note", note);
      fd.set("photos_meta", JSON.stringify(uploadedMeta));

      const result = yearId
        ? await updateBabyBookYear(yearId, fd)
        : await createBabyBookYear(fd);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/dashboard/baby-book/${memberId}`);
      router.refresh();
    });
  }

  const totalPhotos = existingPhotos.length + selectedFiles.length;
  const canAddMore = totalPhotos < 5;

  const age = birthDate ? year - new Date(birthDate).getFullYear() : null;

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
          {existingPhotos.map((photo) => (
            <div key={photo.id} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-[var(--border)]">
              <Image
                src={photo.url}
                alt="Baby book photo"
                fill
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

      {/* Year */}
      <div>
        <label htmlFor="baby-book-year" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
          Year <span className="text-red-500">*</span>
        </label>
        <select
          id="baby-book-year"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value, 10))}
          disabled={!!yearId}
          className="input-base w-full sm:w-48"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        {age != null && (
          <p className="mt-1 text-xs text-[var(--muted)]">
            {memberName} {age === 0 ? "was a newborn" : `was ${age} year${age === 1 ? "" : "s"} old`}
          </p>
        )}
      </div>

      {/* Note */}
      <div>
        <label htmlFor="baby-book-note" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
          Note <span className="text-[var(--muted)] font-normal text-xs">(optional)</span>
        </label>
        <textarea
          id="baby-book-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={`What was happening in ${memberName}'s life this year? Milestones, firsts, favourite things…`}
          className="input-base w-full resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="min-h-[44px] rounded-full bg-[var(--primary)] px-6 py-2.5 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {uploadProgress ?? (isPending ? "Saving…" : yearId ? "Save changes" : "Save year")}
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
