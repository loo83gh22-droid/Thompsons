"use client";

export function AudioPlayer({ src }: { src: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
      <audio src={src} controls className="h-10 w-full" preload="metadata" />
    </div>
  );
}
