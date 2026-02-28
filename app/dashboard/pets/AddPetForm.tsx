"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { addPet } from "./actions";

type Member = { id: string; name: string };

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

export function AddPetForm() {
  const router = useRouter();
  const { activeFamilyId } = useFamily();
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  const [name,           setName]           = useState("");
  const [species,        setSpecies]        = useState("dog");
  const [breed,          setBreed]          = useState("");
  const [birthday,       setBirthday]       = useState("");
  const [adoptedDate,    setAdoptedDate]    = useState("");
  const [passedDate,     setPassedDate]     = useState("");
  const [hasPassed,      setHasPassed]      = useState(false);
  const [description,    setDescription]    = useState("");
  const [ownerIds,       setOwnerIds]       = useState<string[]>([]); // empty = everyone's pet
  const [photos,         setPhotos]         = useState<File[]>([]);
  const [photoPreviews,  setPhotoPreviews]  = useState<string[]>([]);
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

  function toggleOwner(id: string) {
    setOwnerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - photos.length);
    const next = [...photos, ...files].slice(0, 5);
    setPhotos(next);
    setPhotoPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  function removePhoto(idx: number) {
    const next = photos.filter((_, i) => i !== idx);
    setPhotos(next);
    setPhotoPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  function resetForm() {
    setName(""); setSpecies("dog"); setBreed(""); setBirthday("");
    setAdoptedDate(""); setPassedDate(""); setHasPassed(false);
    setDescription(""); setOwnerIds([]); setPhotos([]); setPhotoPreviews([]);
    setError(null);
  }

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
      photos.forEach((f) => fd.append("photos", f));

      const result = await addPet(fd);
      if (!result.success) { setError(result.error); return; }

      resetForm();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        data-add-pet
        onClick={() => setOpen(true)}
        className="min-h-[44px] rounded-full bg-[var(--primary)] px-4 py-2 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
      >
        + Add a pet
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">Add a pet</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">Current members of the family and beloved ones we&apos;ve lost.</p>

      <div className="mt-6 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Biscuit, Luna, Mr Whiskers"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {/* Species + Breed */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">Type *</label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
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
              placeholder="e.g. Labrador, Tabby"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
        </div>

        {/* Whose pet — multi-select checkboxes */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Whose pet is this?</label>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Leave all unchecked for &quot;Everyone&apos;s pet&quot;, or select specific family members.
          </p>
          {members.length > 0 ? (
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
          ) : (
            <p className="mt-2 text-xs text-[var(--muted)] italic">Loading family members…</p>
          )}
          {ownerIds.length === 0 && (
            <p className="mt-2 text-xs text-[var(--accent)]">🐾 Everyone&apos;s pet</p>
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
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">Adopted / joined family</label>
            <input
              type="text"
              value={adoptedDate}
              onChange={(e) => setAdoptedDate(e.target.value)}
              placeholder="e.g. 2021 or June 2021"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
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
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
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
            placeholder="Personality, favourite toys, funny habits, what made them special..."
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Photos (up to 5)</label>
          {photoPreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {photoPreviews.map((src, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover border border-[var(--border)]" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {photos.length < 5 && (
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
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[var(--primary)] px-5 py-2 font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add pet"}
        </button>
        <button
          type="button"
          onClick={() => { resetForm(); setOpen(false); }}
          className="rounded-lg border border-[var(--border)] px-4 py-2 font-medium hover:bg-[var(--surface-hover)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
