"use client";

import { useState } from "react";
import { Music2, ChevronLeft } from "lucide-react";

export function MusicPlayer({ playlistId }: { playlistId: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Minimized tab - always visible on the left */}
      <button
        onClick={() => setExpanded(true)}
        className={`fixed left-0 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-1 rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--surface)] px-2 py-4 shadow-lg transition-all hover:bg-[var(--surface-hover)] ${
          expanded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        title="Open music player"
      >
        <Music2 className="h-6 w-6 text-[var(--accent)]" />
        <span className="text-[10px] font-medium text-[var(--muted)]">
          Music
        </span>
      </button>

      {/* Expanded panel - slides in from the left */}
      <div
        className={`fixed left-0 top-0 z-40 flex h-full flex-col border-r border-[var(--border)] bg-[var(--background)] shadow-xl transition-transform duration-300 ${
          expanded ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "min(420px, 90vw)" }}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
            Music
          </h2>
          <button
            onClick={() => setExpanded(false)}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            title="Minimize"
          >
            <ChevronLeft className="h-4 w-4" />
            Minimize
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <iframe
            src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
            width="100%"
            height="380"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg"
            title="Spotify playlist"
          />
        </div>
      </div>

      {/* Backdrop when expanded - click to minimize */}
      {expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
          aria-label="Close music player"
        />
      )}
    </>
  );
}
