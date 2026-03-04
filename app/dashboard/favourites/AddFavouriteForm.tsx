"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addFavourite } from "./actions";
import type { FavouriteCategory } from "./actions";
import type { Member } from "./CategoryView";

export function AddFavouriteForm({
  category,
  categoryLabel,
  members,
  defaultMemberId,
}: {
  category: FavouriteCategory;
  categoryLabel: string;
  members: Member[];
  defaultMemberId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    defaultMemberId ?? members[0]?.id ?? ""
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [age, setAge] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const singular = categoryLabel.toLowerCase().replace(/s$/, "");
  const isAllView = defaultMemberId === null;

  function handleOpen() {
    // Sync the member selector when opening (in case filter changed since last open)
    setSelectedMemberId(defaultMemberId ?? members[0]?.id ?? "");
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setTitle("");
    setDescription("");
    setNotes("");
    setAge("");
    setPhoto(null);
    setPhotoPreview(null);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !selectedMemberId) return;
    setLoading(true);
    const parsedAge = age.trim() ? parseInt(age.trim(), 10) : undefined;
    try {
      await addFavourite(
        category,
        title.trim(),
        selectedMemberId,
        description.trim() || undefined,
        notes.trim() || undefined,
        Number.isFinite(parsedAge) ? parsedAge : undefined,
        photo
      );
      handleClose();
      router.refresh();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const selectedMemberName =
    members.find((m) => m.id === selectedMemberId)?.name ?? "";

  return (
    <div className={open ? "w-full" : undefined}>
      {!open && (
        <button
          type="button"
          onClick={handleOpen}
          className="min-h-[36px] rounded-full border border-[var(--accent)]/50 px-4 py-1.5 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          + Add
        </button>
      )}

      {open && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          {/* Member selector — shown in All view; read-only label when filtered */}
          {isAllView ? (
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
                Adding for
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="" disabled>
                  Choose a family member…
                </option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="mb-3 text-sm text-[var(--muted)]">
              Adding for{" "}
              <span className="font-medium text-[var(--foreground)]">
                {selectedMemberName}
              </span>
            </p>
          )}

          <input
            type="text"
            placeholder={`Add a ${singular}…`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <label className="whitespace-nowrap text-sm text-[var(--muted)]">
              Age at the time
            </label>
            <input
              type="number"
              min={0}
              max={120}
              placeholder="e.g. 5"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-24 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {/* Photo picker */}
          <div className="mt-3">
            {photoPreview ? (
              <div className="relative h-24 w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-24 w-24 rounded-lg border border-[var(--border)] object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setPhotoPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--foreground)] text-xs leading-none text-[var(--background)]"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <span>📷</span> Add photo (optional)
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={loading || !selectedMemberId}
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
