"use client";

import { useState, useTransition } from "react";
import { addFilm, updateFilm, deleteFilm } from "./actions";

type Film = {
  id: string;
  title: string;
  type: "movie" | "series";
  status: "want_to_watch" | "watching" | "watched";
  is_family_pick: boolean;
  rating: number | null;
  notes: string | null;
  added_by: string | null;
  addedByMember?: { id: string; name: string; nickname: string | null; color: string | null } | null;
};

type Member = { id: string; name: string; nickname: string | null; color: string | null };

type Props = {
  films: Film[];
  members: Member[];
  myRole: string;
};

const STATUS_LABELS = {
  want_to_watch: "Want to Watch",
  watching: "Watching",
  watched: "Watched",
} as const;

const STATUS_COLORS = {
  want_to_watch: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  watching: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  watched: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
} as const;

function StarRating({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? null : star)}
          className={`text-xl ${star <= (value ?? 0) ? "text-yellow-400" : "text-[var(--border)]"} hover:text-yellow-400`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function FilmsClient({ films: initial, members, myRole }: Props) {
  const [films, setFilms] = useState(initial);
  const [filter, setFilter] = useState<"all" | "want_to_watch" | "watching" | "watched" | "family_pick">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "movie" | "series">("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"movie" | "series">("movie");
  const [status, setStatus] = useState<"want_to_watch" | "watching" | "watched">("want_to_watch");
  const [isFamilyPick, setIsFamilyPick] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  function openForm(film?: Film) {
    if (film) {
      setEditId(film.id);
      setTitle(film.title);
      setType(film.type);
      setStatus(film.status);
      setIsFamilyPick(film.is_family_pick);
      setRating(film.rating);
      setNotes(film.notes ?? "");
    } else {
      setEditId(null);
      setTitle(""); setType("movie"); setStatus("want_to_watch");
      setIsFamilyPick(false); setRating(null); setNotes("");
    }
    setFormError("");
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false); setEditId(null); setFormError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setFormError("Title is required."); return; }
    startTransition(async () => {
      if (editId) {
        const res = await updateFilm(editId, title, type, status, isFamilyPick, rating, notes);
        if (res.success) {
          setFilms(films.map(f => f.id !== editId ? f : { ...f, title: title.trim(), type, status, is_family_pick: isFamilyPick, rating, notes: notes.trim() || null }));
          resetForm();
        } else {
          setFormError(res.error ?? "Something went wrong.");
        }
      } else {
        const res = await addFilm(title, type, status, isFamilyPick, rating, notes);
        if (res.success) {
          setFilms([{ id: res.id!, title: title.trim(), type, status, is_family_pick: isFamilyPick, rating, notes: notes.trim() || null, added_by: null }, ...films]);
          resetForm();
        } else {
          setFormError(res.error ?? "Something went wrong.");
        }
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteFilm(id);
      if (res.success) setFilms(films.filter(f => f.id !== id));
    });
  }

  const canEdit = myRole === "owner" || myRole === "adult";

  const filtered = films.filter(f => {
    if (filter === "family_pick") return f.is_family_pick;
    if (filter !== "all" && f.status !== filter) return false;
    if (typeFilter !== "all" && f.type !== typeFilter) return false;
    return true;
  });

  // Counts
  const counts = {
    all: films.length,
    want_to_watch: films.filter(f => f.status === "want_to_watch").length,
    watching: films.filter(f => f.status === "watching").length,
    watched: films.filter(f => f.status === "watched").length,
    family_pick: films.filter(f => f.is_family_pick).length,
  };

  return (
    <div className="mt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(["all", "want_to_watch", "watching", "watched", "family_pick"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${filter === f ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"}`}
            >
              {f === "all" ? "All" : f === "family_pick" ? "⭐ Family Pick" : STATUS_LABELS[f]}
              {" "}
              <span className="opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as "all" | "movie" | "series")}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="all">All types</option>
            <option value="movie">Movies</option>
            <option value="series">Series</option>
          </select>
          <button
            onClick={() => openForm()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">{editId ? "Edit entry" : "Add film or series"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Title <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} autoFocus placeholder="e.g. The Bear, Oppenheimer, The Office…" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">Type</label>
                <div className="mt-1.5 flex gap-2">
                  {(["movie", "series"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setType(t)}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium ${type === t ? "bg-[var(--accent)] text-white" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"}`}
                    >
                      {t === "movie" ? "🎬 Movie" : "📺 Series"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as typeof status)} className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none">
                  <option value="want_to_watch">Want to Watch</option>
                  <option value="watching">Watching</option>
                  <option value="watched">Watched</option>
                </select>
              </div>
            </div>
            {status === "watched" && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">Rating</label>
                <div className="mt-1.5"><StarRating value={rating} onChange={setRating} /></div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Thoughts, recommendations, who suggested it…" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none" />
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={isFamilyPick} onChange={e => setIsFamilyPick(e.target.checked)} className="h-4 w-4 rounded" />
              <span className="text-sm text-[var(--foreground)]">⭐ Family Pick (everyone should watch this)</span>
            </label>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {isPending ? "Saving…" : editId ? "Save changes" : "Add to list"}
              </button>
              <button type="button" onClick={resetForm} className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)]">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="mt-20 text-center">
          <div className="text-5xl">🎬</div>
          <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">Nothing here yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Add movies and series your family wants to watch, is watching, or has seen.</p>
        </div>
      )}

      {/* Film list */}
      <div className="space-y-3">
        {filtered.map(film => (
          <div key={film.id} className={`group flex items-start gap-4 rounded-xl border p-4 ${film.is_family_pick ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800/30 dark:bg-yellow-900/10" : "border-[var(--border)] bg-[var(--card)]"}`}>
            <div className="mt-0.5 text-2xl">{film.type === "movie" ? "🎬" : "📺"}</div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-[var(--foreground)]">{film.title}</h3>
                {film.is_family_pick && <span className="text-xs">⭐ Family Pick</span>}
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[film.status]}`}>
                  {STATUS_LABELS[film.status]}
                </span>
              </div>
              {film.rating && (
                <div className="mt-1 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-sm ${i < film.rating! ? "text-yellow-400" : "text-[var(--border)]"}`}>★</span>
                  ))}
                </div>
              )}
              {film.notes && <p className="mt-1 text-sm text-[var(--muted)]">{film.notes}</p>}
            </div>
            {canEdit && (
              <div className="hidden gap-1 group-hover:flex">
                <button onClick={() => openForm(film)} className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface)]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => handleDelete(film.id)} disabled={isPending} className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-red-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
