"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type Photo = { id: string; url: string; caption: string | null };

interface JournalPhotoGalleryProps {
  photos: Photo[];
  title: string;
}

export function JournalPhotoGallery({ photos, title }: JournalPhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") closeLightbox();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, goNext, goPrev]);

  if (photos.length === 0) return null;

  return (
    <>
      {/* Thumbnail strip */}
      <div className="flex flex-wrap gap-2 px-5 pb-5 sm:px-6 sm:pb-6">
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => openLightbox(idx)}
            className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] hover:opacity-90 transition-opacity"
            aria-label={`View photo ${idx + 1}${photo.caption ? `: ${photo.caption}` : ""}`}
          >
            <Image
              src={photo.url}
              alt={photo.caption || title || "Photo"}
              fill
              unoptimized
              className="object-cover"
              sizes="80px"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors focus:outline-none"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Prev button */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors focus:outline-none"
              aria-label="Previous photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Main image */}
          <div
            className="flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].caption || title || "Photo"}
              className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
            {photos[lightboxIndex].caption && (
              <p className="mt-3 text-center text-sm text-white/80">
                {photos[lightboxIndex].caption}
              </p>
            )}
          </div>

          {/* Next button */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors focus:outline-none"
              aria-label="Next photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] px-4">
              {photos.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                  className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md transition-all focus:outline-none ${
                    idx === lightboxIndex
                      ? "ring-2 ring-white opacity-100"
                      : "opacity-50 hover:opacity-80"
                  }`}
                  aria-label={`Go to photo ${idx + 1}`}
                >
                  <Image
                    src={p.url}
                    alt={p.caption || ""}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
