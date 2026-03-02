"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

type Photo = { id: string; url: string; caption: string | null; kind: "photo" };
type Video = { id: string; url: string; duration_seconds: number | null; kind: "video" };
type MediaItem = Photo | Video;

interface JournalPhotoGalleryProps {
  photos: { id: string; url: string; caption: string | null }[];
  videos: { id: string; url: string; duration_seconds: number | null }[];
  title: string;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function JournalPhotoGallery({ photos, videos, title }: JournalPhotoGalleryProps) {
  const media: MediaItem[] = [
    ...photos.map((p) => ({ ...p, kind: "photo" as const })),
    ...videos.map((v) => ({ ...v, kind: "video" as const })),
  ];

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % media.length));
  }, [media.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + media.length) % media.length));
  }, [media.length]);

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

  // Pause video when navigating away
  useEffect(() => {
    if (videoRef.current) videoRef.current.pause();
  }, [lightboxIndex]);

  if (media.length === 0) return null;

  const current = lightboxIndex !== null ? media[lightboxIndex] : null;

  return (
    <>
      {/* Thumbnail strip */}
      <div className="flex flex-wrap gap-2 px-5 pb-5 sm:px-6 sm:pb-6">
        {media.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openLightbox(idx)}
            className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-black focus:outline-none focus:ring-2 focus:ring-[var(--accent)] hover:opacity-90 transition-opacity"
            aria-label={item.kind === "photo"
              ? `View photo ${idx + 1}${item.caption ? `: ${item.caption}` : ""}`
              : `Play video ${idx + 1}`}
          >
            {item.kind === "photo" ? (
              <Image
                src={item.url}
                alt={item.caption || title || "Photo"}
                fill
                unoptimized
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <>
                {/* Video first-frame preview */}
                <video
                  src={item.url}
                  preload="metadata"
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90">
                    <svg className="h-3.5 w-3.5 translate-x-px text-black" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6 3.5l7 4.5-7 4.5V3.5z" />
                    </svg>
                  </div>
                </div>
                {item.duration_seconds && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] text-white">
                    {formatDuration(item.duration_seconds)}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92"
          onClick={closeLightbox}
        >
          {/* Close */}
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
            {lightboxIndex + 1} / {media.length}
          </div>

          {/* Prev */}
          {media.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors focus:outline-none"
              aria-label="Previous"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Main content */}
          <div
            className="flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {current.kind === "photo" ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.url}
                  alt={current.caption || title || "Photo"}
                  className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                />
                {current.caption && (
                  <p className="mt-3 text-center text-sm text-white/80">{current.caption}</p>
                )}
              </>
            ) : (
              /* eslint-disable-next-line jsx-a11y/media-has-caption -- family home video */
              <video
                ref={videoRef}
                src={current.url}
                controls
                autoPlay
                playsInline
                className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-2xl bg-black"
              />
            )}
          </div>

          {/* Next */}
          {media.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors focus:outline-none"
              aria-label="Next"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Bottom thumbnail strip */}
          {media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] px-4">
              {media.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                  className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-black transition-all focus:outline-none ${
                    idx === lightboxIndex ? "ring-2 ring-white opacity-100" : "opacity-50 hover:opacity-80"
                  }`}
                  aria-label={`Go to item ${idx + 1}`}
                >
                  {item.kind === "photo" ? (
                    <Image src={item.url} alt="" fill unoptimized className="object-cover" sizes="56px" />
                  ) : (
                    <>
                      <video src={item.url} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/80">
                          <svg className="h-2.5 w-2.5 translate-x-px text-black" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M6 3.5l7 4.5-7 4.5V3.5z" />
                          </svg>
                        </div>
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
