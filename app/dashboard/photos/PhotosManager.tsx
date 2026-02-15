"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { addPhoto, removePhoto } from "./actions";
import { EmptyState } from "../components/EmptyState";

type Photo = { id: string; url: string; sort_order: number };

export function PhotosManager({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.size === 0) return;
    setUploading(true);
    setError(null);
    try {
      const newPhoto = await addPhoto(file);
      setPhotos((p) => [...p, newPhoto].sort((a, b) => a.sort_order - b.sort_order));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemove(id: string) {
    setError(null);
    try {
      await removePhoto(id);
      setPhotos((p) => p.filter((x) => x.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove.");
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center gap-4">
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
          {photos.length} photos
        </span>
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
          description="Upload photos to build your family's visual story. They'll appear here and in the background mosaic."
          actionLabel="+ Upload your first photo"
          onAction={() => fileInputRef.current?.click()}
        />
      ) : null}

      {photos.length > 0 && (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--border)]"
          >
            <Image
              src={photo.url}
              alt="Family photo"
              fill
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
      )}

      <p className="text-sm text-[var(--muted)]">
        These photos appear as the background mosaic on every page.
      </p>
    </div>
  );
}
