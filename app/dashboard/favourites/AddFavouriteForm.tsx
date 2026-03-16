"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addFavourite } from "./actions";
import type { FavouriteCategory } from "./actions";
import type { Member } from "./CategoryView";

export function AddFavouriteForm({
  category,
  categoryLabel,
  members,
  defaultMemberId,
  externalOpen,
  onExternalClose,
}: {
  category: FavouriteCategory;
  categoryLabel: string;
  members: Member[];
  defaultMemberId: string | null;
  externalOpen?: boolean;
  onExternalClose?: () => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
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

  const isOpen = externalOpen ?? internalOpen;

  const singular = categoryLabel.toLowerCase().replace(/s$/, "");
  const isAllView = defaultMemberId === null;

  // Sync member selector when opening via external trigger
  useEffect(() => {
    if (externalOpen) {
      setSelectedMemberId(defaultMemberId ?? members[0]?.id ?? "");
    }
  }, [externalOpen, defaultMemberId, members]);

  function handleOpen() {
    setSelectedMemberId(defaultMemberId ?? members[0]?.id ?? "");
    setInternalOpen(true);
  }

  function handleClose() {
    setInternalOpen(false);
    onExternalClose?.();
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
    <>
      {/* + Add button (only shown when not externally controlled or when internal) */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpen}
          className="min-h-[36px] rounded-full border border-[var(--accent)]/50 px-4 py-1.5 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          + Add
        </button>
      )}

      {/* Modal / Bottom sheet overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={handleClose}
          />

          {/* Mobile: bottom sheet / Desktop: centered modal */}
          {/* Desktop wrapper */}
          <div className="fixed inset-0 z-50 hidden items-center justify-center p-4 sm:flex">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <FormContent
                isAllView={isAllView}
                selectedMemberId={selectedMemberId}
                setSelectedMemberId={setSelectedMemberId}
                members={members}
                selectedMemberName={selectedMemberName}
                singular={singular}
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                notes={notes}
                setNotes={setNotes}
                age={age}
                setAge={setAge}
                photoPreview={photoPreview}
                setPhoto={setPhoto}
                setPhotoPreview={setPhotoPreview}
                fileInputRef={fileInputRef}
                handlePhotoChange={handlePhotoChange}
                loading={loading}
                handleClose={handleClose}
              />
            </form>
          </div>

          {/* Mobile: bottom sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[var(--surface)] p-6 sm:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--border)]" />
            <form onSubmit={handleSubmit}>
              <FormContent
                isAllView={isAllView}
                selectedMemberId={selectedMemberId}
                setSelectedMemberId={setSelectedMemberId}
                members={members}
                selectedMemberName={selectedMemberName}
                singular={singular}
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                notes={notes}
                setNotes={setNotes}
                age={age}
                setAge={setAge}
                photoPreview={photoPreview}
                setPhoto={setPhoto}
                setPhotoPreview={setPhotoPreview}
                fileInputRef={fileInputRef}
                handlePhotoChange={handlePhotoChange}
                loading={loading}
                handleClose={handleClose}
              />
            </form>
          </div>
        </>
      )}
    </>
  );
}

/** Shared form fields extracted to avoid duplication between mobile/desktop layouts */
function FormContent({
  isAllView,
  selectedMemberId,
  setSelectedMemberId,
  members,
  selectedMemberName,
  singular,
  title,
  setTitle,
  description,
  setDescription,
  notes,
  setNotes,
  age,
  setAge,
  photoPreview,
  setPhoto,
  setPhotoPreview,
  fileInputRef,
  handlePhotoChange,
  loading,
  handleClose,
}: {
  isAllView: boolean;
  selectedMemberId: string;
  setSelectedMemberId: (id: string) => void;
  members: Member[];
  selectedMemberName: string;
  singular: string;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  age: string;
  setAge: (v: string) => void;
  photoPreview: string | null;
  setPhoto: (f: File | null) => void;
  setPhotoPreview: (s: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  handleClose: () => void;
}) {
  return (
    <>
      {/* Member selector */}
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
              Choose a family member...
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
        placeholder={`Add a ${singular}...`}
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
          Age when discovered
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
              x
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Add photo (optional)
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
          {loading ? "Adding..." : "Add"}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-hover)]"
        >
          Cancel
        </button>
      </div>
    </>
  );
}
