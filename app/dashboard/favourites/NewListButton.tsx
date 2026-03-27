"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createList } from "./actions";

const EMOJI_SUGGESTIONS = [
  "📚", "🎬", "🎵", "🎲", "🍕", "🎮", "🏆", "✈️", "🌿", "🎨",
  "🐾", "🌟", "🎧", "📺", "🍿", "🎤", "🏀", "⚽", "🎯", "🧩",
];

type Props = {
  primary?: boolean;
  asCard?: boolean;
};

export function NewListButton({ primary, asCard }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleOpen() { setOpen(true); setName(""); setEmoji(""); setError(""); }
  function handleClose() { setOpen(false); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("List name is required."); return; }
    startTransition(async () => {
      const result = await createList(name, emoji);
      if (result.success && result.id) {
        setOpen(false);
        router.push(`/dashboard/favourites/${result.id}`);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  if (asCard) {
    return (
      <>
        <button
          onClick={handleOpen}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-transparent p-5 text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <span className="text-2xl">+</span>
          <span className="text-sm font-medium">New list</span>
        </button>
        {open && <ListModal name={name} setName={setName} emoji={emoji} setEmoji={setEmoji} error={error} isPending={isPending} onClose={handleClose} onSubmit={handleSubmit} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className={
          primary
            ? "rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
            : "rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        }
      >
        + New list
      </button>
      {open && <ListModal name={name} setName={setName} emoji={emoji} setEmoji={setEmoji} error={error} isPending={isPending} onClose={handleClose} onSubmit={handleSubmit} />}
    </>
  );
}

function ListModal({
  name, setName, emoji, setEmoji, error, isPending, onClose, onSubmit,
}: {
  name: string; setName: (v: string) => void;
  emoji: string; setEmoji: (v: string) => void;
  error: string; isPending: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-[var(--card)] p-6 shadow-xl">
        <h2 className="font-display text-xl font-bold text-[var(--foreground)]">New list</h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">Emoji</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {EMOJI_SUGGESTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e === emoji ? "" : e)}
                  className={`rounded-lg p-1.5 text-xl transition ${
                    emoji === e
                      ? "bg-[var(--accent)]/20 ring-2 ring-[var(--accent)]"
                      : "hover:bg-[var(--surface)]"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="Or type any emoji…"
              maxLength={4}
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              List name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Films & Shows, Board Games, Travel Spots"
              autoFocus
              className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create list"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
