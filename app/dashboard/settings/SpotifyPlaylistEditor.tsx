"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSpotifyPlaylist } from "./actions";

export function SpotifyPlaylistEditor({
  currentPlaylistId,
}: {
  currentPlaylistId: string | null;
}) {
  const [value, setValue] = useState(currentPlaylistId ?? "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isDirty = value.trim() !== (currentPlaylistId ?? "");

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await saveSpotifyPlaylist(value);

    if (!result.success) {
      setError(result.error ?? "Something went wrong");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    }
    setSaving(false);
  }

  async function handleClear() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    setValue("");

    const result = await saveSpotifyPlaylist("");
    if (!result.success) {
      setError(result.error ?? "Something went wrong");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor="spotify-playlist"
          className="text-sm font-medium text-[var(--foreground)]"
        >
          Spotify Playlist
        </label>
        <span className="text-xs text-[var(--muted)]">
          Paste a playlist URL or ID
        </span>
      </div>

      <div className="flex gap-3">
        <input
          id="spotify-playlist"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
            setSuccess(false);
          }}
          placeholder="https://open.spotify.com/playlist/..."
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="shrink-0 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {currentPlaylistId && (
        <button
          type="button"
          onClick={handleClear}
          disabled={saving}
          className="text-xs text-[var(--muted)] underline hover:text-[var(--foreground)] disabled:opacity-40"
        >
          Remove playlist
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && (
        <p className="text-xs text-green-600">
          Playlist updated! The music player will reflect the change.
        </p>
      )}
    </div>
  );
}
