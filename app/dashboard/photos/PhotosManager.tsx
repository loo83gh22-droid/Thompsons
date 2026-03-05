"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { addPhoto, removePhoto } from "./actions";
import { EmptyState } from "../components/EmptyState";
import { toast } from "sonner";

type Photo = {
  id: string;
  url: string;
  sort_order: number;
  taken_at: string | null;
  created_at: string;
};

function effectiveDate(photo: Photo): string {
  return photo.taken_at ?? photo.created_at.slice(0, 10);
}

function formatMonthYear(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function groupByMonth(photos: Photo[], newestFirst: boolean): { label: string; photos: Photo[] }[] {
  const groups: Map<string, Photo[]> = new Map();
  for (const photo of photos) {
    const key = effectiveDate(photo).slice(0, 7);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(photo);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => newestFirst ? b.localeCompare(a) : a.localeCompare(b))
    .map(([key, photos]) => ({ label: formatMonthYear(key), photos }));
}

export function PhotosManager({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takenAt, setTakenAt] = useState(new Date().toISOString().slice(0, 10));
  const [newestFirst, setNewestFirst] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.size === 0) return;
    setUploading(true);
    setError(null);
    try {
      const newPhoto = await addPhoto(file, takenAt || undefined);
      setPhotos((p) => [...p, newPhoto]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleRemove(id: string) {
    toast("Delete this photo? This cannot be undone.", {
      action: {
        label: "Delete",
        onClick: async () => {
          setError(null);
          try {
            await removePhoto(id);
            setPhotos((p) => p.filter((x) => x.id !== id));
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to remove.");
          }
        },
      },
      cancel: { label: "Cancel" },
      duration: 8000,
    });
  }

  const groups = groupByMonth(photos, newestFirst);

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--muted)]">
            Photo date
          </label>
          <input
            type="date"
            value={takenAt}
            onChange={(e) => setTakenAt(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        <label className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full bg-[var(--primary)] px-4 py-3 font-medium text-[var(--primary-foreground)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]">
          {uploading ? "Uploading..." : "Add photo"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleUpload}
            disabled={uploading}
            aria-label="Choose photo to upload"
          />
        </label>

        <span className="text-sm text-[var(--muted)]">
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </span>

        {photos.length > 0 && (
          <button
            onClick={() => setNewestFirst((v) => !v)}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            {newestFirst ? "↓ Newest first" : "↑ Oldest first"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {!photos.length ? (
        <EmptyState
          icon="📷"
          headline="No photos yet"
          description="Upload photos to build your family's visual story. They'll appear here in chronological order and in the background mosaic."
          actionLabel="+ Upload your first photo"
          onAction={() => fileInputRef.current?.click()}
        />
      ) : (
        <div className="space-y-8">
          {groups.map(({ label, photos: groupPhotos }) => (
            <div key={label}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                {label}
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
                {groupPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--border)]"
                  >
                    <Image
                      src={photo.url}
                      alt="Family photo"
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="150px"
                    />
                    <button
                      onClick={() => handleRemove(photo.id)}
                      className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-[var(--muted)]">
        These photos appear as the background mosaic on every page.
      </p>
    </div>
  );
}
