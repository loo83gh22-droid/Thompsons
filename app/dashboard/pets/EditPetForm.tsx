"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { updatePet } from "./actions";

type Member   = { id: string; name: string };
type PetPhoto = { id: string; url: string; sort_order: number };
type PetOwner = { member_id: string; member: { name: string } | null };

export type EditablePet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthday: string | null;
  adopted_date: string | null;
  has_passed: boolean;
  passed_date: string | null;
  description: string | null;
  pet_owners: PetOwner[];
  pet_photos: PetPhoto[];
};

const SPECIES_OPTIONS = [
  { value: "dog",     label: "Dog 🐕" },
  { value: "cat",     label: "Cat 🐈" },
  { value: "bird",    label: "Bird 🐦" },
  { value: "fish",    label: "Fish 🐠" },
  { value: "rabbit",  label: "Rabbit 🐇" },
  { value: "hamster", label: "Hamster 🐹" },
  { value: "reptile", label: "Reptile 🦎" },
  { value: "other",   label: "Other 🐾" },
];

export function EditPetForm({ pet, onClose }: { pet: EditablePet; onClose: () => void }) {
  const router = useRouter();
  const { activeFamilyId } = useFamily();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  // Pre-fill from pet
  const [name,        setName]        = useState(pet.name);
  const [species,     setSpecies]     = useState(pet.species);
  const [breed,       setBreed]       = useState(pet.breed ?? "");
  const [birthday,    setBirthday]    = useState(pet.birthday ?? "");
  const [adoptedDate, setAdoptedDate] = useState(pet.adopted_date ?? "");
  const [passedDate,  setPassedDate]  = useState(pet.passed_date ?? "");
  const [hasPassed,   setHasPassed]   = useState(pet.has_passed);
  const [description, setDescription] = useState(pet.description ?? "");
  const [ownerIds,    setOwnerIds]    = useState<string[]>(
    pet.pet_owners.map((o) => o.member_id)
  );

  // Photo state
  const sortedExisting = [...pet.pet_photos].sort((a, b) => a.sort_order - b.sort_order);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [newPhotos,      setNewPhotos]      = useState<File[]>([]);
  const [newPreviews,    setNewPreviews]    = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activeFamilyId) return;
    const supabase = createClient();
    supabase
      .from("family_members")
      .select("id, name")
      .eq("family_id", activeFamilyId)
      .order("name")
      .then(({ data }) => { if (data) setMembers(data as Member[]); });
  }, [activeFamilyId]);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  function toggleOwner(id: string) {
    setOwnerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleDeletePhoto(id: string) {
    setPhotosToDelete((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleNewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const remaining = 5 - (sortedExisting.length - photosToDelete.length) - newPhotos.length;
    const files = Array.from(e.target.files ?? []).slice(0, remaining);
    const next = [...newPhotos, ...files].slice(0, 5);
    setNewPhotos(next);
    setNewPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  function removeNewPhoto(idx: number) {
    const next = newPhotos.filter((_, i) => i !== idx);
    setNewPhotos(next);
    setNewPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  const totalPhotoCount =
    sortedExisting.filter((p) => !photosToDelete.includes(p.id)).length + newPhotos.length;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("name",         name.trim());
      fd.set("species",      species);
      fd.set("breed",        breed.trim());
      fd.set("birthday",     birthday);
      fd.set("adopted_date", adoptedDate);
      fd.set("has_passed",   hasPassed ? "true" : "false");
      fd.set("passed_date",  hasPassed ? passedDate : "");
      fd.set("description",  description.trim());
      ownerIds.forEach((id) => fd.append("owner_member_ids[]", id));
      photosToDelete.forEach((id) => fd.append("delete_photo_ids[]", id));
      newPhotos.forEach((f) => fd.append("new_photos", f));

      const result = await updatePet(pet.id, fd);
      if (!result.success) { setError(result.error); return; }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Modal backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-10 pb-10"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
            Edit {pet.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {/* Species + Breed */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">Type *</label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              >
                {SPECIES_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">Breed</label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="e.g. Labrador"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>

          {/* Owners */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">Whose pet?</label>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Leave all unchecked for &quot;Everyone&apos;s pet&quot;</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {members.map((m) => {
                const checked = ownerIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleOwner(m.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      checked
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--background)] font-medium"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    }`}
                  >
                    {checked ? "✓ " : ""}{m.name}
                  </button>
                );
              })}
            </div>
            {ownerIds.length === 0 && (
              <p className="mt-1.5 text-xs text-[var(--accent)]">🐾 Everyone&apos;s pet</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">Birthday</label>
              <input
                type="text"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                placeholder="e.g. 2019 or March 2019"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">Adopted</label>
              <input
                type="text"
                value={adoptedDate}
                onChange={(e) => setAdoptedDate(e.target.value)}
                placeholder="e.g. 2021 or June 2021"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>

          {/* Passed away */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={hasPassed}
                onChange={(e) => setHasPassed(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
              />
              This pet has passed away
            </label>
            {hasPassed && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-[var(--muted)]">
                  When did they pass? <span className="font-normal text-[var(--muted)]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={passedDate}
                  onChange={(e) => setPassedDate(e.target.value)}
                  placeholder="e.g. 2023 or April 2023"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">About them</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Personality, favourite toys, funny habits..."
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Photos ({totalPhotoCount}/5)
            </label>

            {/* Existing photos */}
            {sortedExisting.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-[var(--muted)] mb-1.5">Tap × to remove a photo</p>
                <div className="flex flex-wrap gap-2">
                  {sortedExisting.map((ph) => {
                    const markedForDelete = photosToDelete.includes(ph.id);
                    return (
                      <div key={ph.id} className="relative">
                        <div className={`relative h-20 w-20 overflow-hidden rounded-lg border ${markedForDelete ? "opacity-30 border-red-300" : "border-[var(--border)]"}`}>
                          <Image
                            src={ph.url}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleDeletePhoto(ph.id)}
                          className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs leading-none text-white ${
                            markedForDelete ? "bg-[var(--accent)]" : "bg-red-500"
                          }`}
                          title={markedForDelete ? "Undo remove" : "Remove photo"}
                        >
                          {markedForDelete ? "↩" : "×"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New photo previews */}
            {newPreviews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {newPreviews.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover border border-[var(--accent)]/50" />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(i)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new photos button */}
            {totalPhotoCount < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 flex min-h-[44px] items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                📷 Add photos
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleNewPhotos}
              className="hidden"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[var(--primary)] px-5 py-2 font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 font-medium hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
