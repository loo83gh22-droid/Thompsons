"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { removeFavourite, updateFavourite } from "./actions";

type Item = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  age: number | null;
  photo_url: string | null;
  created_at: string;
};

export function CurrentFavourites({
  items,
  memberName,
  categoryLabel,
}: {
  items: Item[];
  memberName: string;
  categoryLabel: string;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [clearPhoto, setClearPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleRemove(id: string) {
    setRemoving(id);
    try {
      await removeFavourite(id);
      router.refresh();
    } finally {
      setRemoving(null);
    }
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditNotes(item.notes || "");
    setEditAge(item.age != null ? String(item.age) : "");
    setEditPhoto(null);
    setEditPhotoPreview(null);
    setClearPhoto(false);
  }

  function handleEditPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setEditPhoto(file);
    setClearPhoto(false);
    if (file) {
      setEditPhotoPreview(URL.createObjectURL(file));
    } else {
      setEditPhotoPreview(null);
    }
  }

  async function handleSave() {
    if (!editingId || !editTitle.trim()) return;
    setSaving(true);
    const parsedAge = editAge.trim() ? parseInt(editAge.trim(), 10) : undefined;
    try {
      await updateFavourite(editingId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        notes: editNotes.trim() || undefined,
        age: Number.isFinite(parsedAge) ? parsedAge : undefined,
        photo: editPhoto,
        clearPhoto,
      });
      setEditingId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-6 py-10 text-center">
        <p className="text-2xl">⭐</p>
        <p className="mt-2 font-medium text-[var(--foreground)]">
          {memberName} hasn&apos;t added any {categoryLabel.toLowerCase()} yet
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Use the + Add button above to add their first favourite
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        if (editingId === item.id) {
          const currentPhoto = clearPhoto ? null : (editPhotoPreview ?? item.photo_url);
          return (
            <div
              key={item.id}
              className="rounded-xl border border-[var(--accent)]/50 bg-[var(--surface)] p-4"
            >
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title"
                autoFocus
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--muted)] placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:outline-none"
              />
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--muted)] placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:outline-none"
              />
              <div className="mt-2 flex items-center gap-2">
                <label className="text-sm text-[var(--muted)] whitespace-nowrap">
                  Age at the time
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  placeholder="e.g. 5"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              {/* Photo edit */}
              <div className="mt-3">
                {currentPhoto ? (
                  <div className="relative w-20 h-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentPhoto}
                      alt="Photo"
                      className="w-20 h-20 rounded-lg object-cover border border-[var(--border)]"
                    />
                    <button
                      type="button"
                      onClick={() => { setClearPhoto(true); setEditPhoto(null); setEditPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] text-xs leading-none"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    <span>📷</span> Add photo
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditPhotoChange}
                  className="hidden"
                />
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg border border-[var(--border)] px-4 py-1.5 text-sm hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.id}
            className="group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all hover:border-[var(--accent)]/40 hover:shadow-sm"
          >
            {item.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.photo_url}
                alt={item.title}
                className="w-full h-36 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="font-medium leading-snug text-[var(--foreground)]">
                {item.title}
              </h3>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                  {item.description}
                </p>
              )}
              {item.notes && (
                <p className="mt-1.5 text-xs italic text-[var(--muted)]">
                  {item.notes}
                </p>
              )}
              {item.age != null && (
                <p className="mt-2 text-xs font-medium text-[var(--accent)]">
                  Age {item.age}
                </p>
              )}
              <div className="mt-3 flex gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={removing === item.id}
                  className="text-xs text-[var(--muted)] transition-colors hover:text-red-500 disabled:opacity-50"
                >
                  {removing === item.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
