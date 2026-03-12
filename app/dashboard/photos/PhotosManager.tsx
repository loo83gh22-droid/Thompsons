"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { addPhoto, removePhoto } from "./actions";
import { EmptyState } from "../components/EmptyState";

type Photo = { id: string; url: string; sort_order: number; caption?: string | null };

export function PhotosManager({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pending upload state — file chosen, waiting for caption + confirm
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [pendingCaption, setPendingCaption] = useState("");

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.size === 0) return;
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setPendingCaption("");
    setError(null);
    e.target.value = "";
  }

  function cancelPending() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
    setPendingCaption("");
  }

  async function confirmUpload() {
    if (!pendingFile) return;
    setUploading(true);
    setError(null);
    try {
      const newPhoto = await addPhoto(pendingFile, pendingCaption);
      setPhotos((p) => [...p, newPhoto].sort((a, b) => a.sort_order - b.sort_order));
      cancelPending();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
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
        {!pendingFile && (
          <label className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full bg-[var(--primary)] px-4 py-3 font-medium text-[var(--primary-foreground)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]">
            {uploading ? "Uploading..." : "Add photo"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChosen}
              disabled={uploading}
              aria-label="Choose photo to upload"
            />
          </label>
        )}
        <span className="text-sm text-[var(--muted)]">
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Pending upload — caption + confirm */}
      {pendingFile && pendingPreview && (
        <div className="rounded-xl border border-[var(--accent)] bg-[var(--surface)] p-4 space-y-3 max-w-sm">
          <p className="text-sm font-medium text-[var(--foreground)]">Almost there — add a caption (optional)</p>
          <div className="flex items-start gap-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pendingPreview} alt="Preview" className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={pendingCaption}
                onChange={(e) => setPendingCaption(e.target.value)}
                maxLength={200}
                placeholder="e.g. Christmas morning, 2024"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmUpload(); } }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmUpload}
              disabled={uploading}
              className="flex-1 rounded-full bg-[var(--primary)] py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
            <button
              type="button"
              onClick={cancelPending}
              disabled={uploading}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {!photos.length && !pendingFile ? (
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
                alt={photo.caption ?? "Family photo"}
                fill
                className="object-cover"
                sizes="150px"
              />
              {photo.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-black/50 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-xs text-white">{photo.caption}</p>
                </div>
              )}
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
