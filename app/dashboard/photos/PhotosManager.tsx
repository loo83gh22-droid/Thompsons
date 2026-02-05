"use client";

import { useState } from "react";
import Image from "next/image";
import { addPhoto, removePhoto } from "./actions";

type Photo = { id: string; url: string; sort_order: number };

export function PhotosManager({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex items-center gap-4">
        <label className="cursor-pointer rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)]">
          {uploading ? "Uploading..." : "Add photo"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
        <span className="text-sm text-[var(--muted)]">
          {photos.length} photos
        </span>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--border)]"
          >
            <Image
              src={photo.url}
              alt=""
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

      <p className="text-sm text-[var(--muted)]">
        These photos appear as the background mosaic on every page.
      </p>
    </div>
  );
}
