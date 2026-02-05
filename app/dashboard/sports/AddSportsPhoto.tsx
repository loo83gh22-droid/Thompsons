"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addSportsPhoto } from "./actions";

export function AddSportsPhoto() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [sport, setSport] = useState("");
  const [year, setYear] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement)?.files?.[0];
    if (!file || file.size === 0) return;

    setLoading(true);
    try {
      await addSportsPhoto(file, {
        title: title.trim() || undefined,
        caption: caption.trim() || undefined,
        sport: sport.trim() || undefined,
        year: year ? parseInt(year, 10) : undefined,
      });
      setTitle("");
      setCaption("");
      setSport("");
      setYear("");
      setOpen(false);
      router.refresh();
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {open ? (
        <form
          onSubmit={handleSubmit}
          className="sports-trophy-frame max-w-md rounded-xl border-2 border-[var(--sports-gold)] bg-white p-6 shadow-lg"
        >
          <h3 className="mb-4 font-display text-lg font-semibold text-[var(--sports-dark)]">
            Add to the trophy case
          </h3>
          <input
            name="file"
            type="file"
            accept="image/*"
            required
            className="mb-4 w-full text-sm text-[var(--sports-dark)] file:mr-4 file:rounded file:border-0 file:bg-[var(--sports-gold)] file:px-4 file:py-2 file:font-semibold file:text-[var(--sports-dark)]"
          />
          <input
            type="text"
            placeholder="Title (e.g. OUA All Star Game)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-3 w-full rounded border border-[var(--sports-border)] bg-white px-4 py-2 text-[var(--sports-dark)] placeholder:text-[var(--sports-muted)] focus:border-[var(--sports-gold)] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Sport (e.g. Baseball, Soccer)"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="mb-3 w-full rounded border border-[var(--sports-border)] bg-white px-4 py-2 text-[var(--sports-dark)] placeholder:text-[var(--sports-muted)] focus:border-[var(--sports-gold)] focus:outline-none"
          />
          <input
            type="number"
            placeholder="Year"
            min={1900}
            max={2100}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="mb-3 w-full rounded border border-[var(--sports-border)] bg-white px-4 py-2 text-[var(--sports-dark)] placeholder:text-[var(--sports-muted)] focus:border-[var(--sports-gold)] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="mb-4 w-full rounded border border-[var(--sports-border)] bg-white px-4 py-2 text-[var(--sports-dark)] placeholder:text-[var(--sports-muted)] focus:border-[var(--sports-gold)] focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-[var(--sports-gold)] px-4 py-2 font-semibold text-[var(--sports-dark)] hover:bg-[var(--sports-gold-hover)] disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Add Photo"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border-2 border-[var(--sports-border)] px-4 py-2 font-medium text-[var(--sports-dark)] hover:bg-[var(--sports-cream)]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="sports-pennant-btn rounded-lg border-2 border-[var(--sports-gold)] bg-[var(--sports-cream)] px-6 py-3 font-semibold text-[var(--sports-dark)] transition-colors hover:bg-[var(--sports-gold)] hover:text-[var(--sports-cream)]"
        >
          + Add Photo
        </button>
      )}
    </div>
  );
}
