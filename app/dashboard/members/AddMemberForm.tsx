"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { addFamilyMember } from "./actions";
import { addRelationship } from "../our-family/actions";
import { RELATIONSHIP_OPTIONS } from "./constants";

const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp,image/gif";

type LinkMember = { id: string; name: string; nickname?: string | null };

export function AddMemberForm({
  triggerClassName,
  linkMembers = [],
}: { triggerClassName?: string; linkMembers?: LinkMember[] } = {}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<{ type: "spouse" | "child" | "parent"; memberId: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function resetForm() {
    setName("");
    setRelationship("");
    setNickname("");
    setEmail("");
    setBirthDate("");
    setBirthPlace("");
    setLinks([]);
    setError(null);
    clearPhoto();
  }

  function closeModal() {
    setOpen(false);
    resetForm();
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  function clearPhoto() {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (!relationship.trim()) {
      setError("Please select how they are related to you.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let avatarUrl: string | null = null;
      if (photoFile) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `members/${user.id}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("member-photos")
          .upload(path, photoFile, { upsert: true });
        if (uploadError) throw uploadError;
        avatarUrl = `/api/storage/member-photos/${path}`;
      }

      const result = await addFamilyMember(
        name.trim(),
        relationship.trim(),
        email.trim() || "",
        birthDate || "",
        birthPlace.trim() || "",
        nickname.trim() || null,
        avatarUrl
      );

      const validLinks = links.filter((l) => l.memberId);
      if (result?.id && validLinks.length > 0) {
        for (const link of validLinks) {
          if (link.type === "parent") {
            await addRelationship(link.memberId, result.id, "child");
          } else {
            await addRelationship(result.id, link.memberId, link.type);
          }
        }
      }

      // Close modal and refresh — member was added successfully
      closeModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName ?? "min-h-[44px] rounded-lg border border-[var(--accent)]/50 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"}
      >
        + Add member
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-member-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Modal card */}
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
              <h3
                id="add-member-title"
                className="font-display text-lg font-semibold text-[var(--foreground)]"
              >
                Add a family member
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="am-name" className="block text-sm font-medium text-[var(--muted)]">
                  Full name <span className="text-red-400">*</span>
                </label>
                <input
                  id="am-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="input-base mt-1 w-full"
                  placeholder="e.g. Sarah"
                />
              </div>

              <div>
                <label htmlFor="am-relationship" className="block text-sm font-medium text-[var(--muted)]">
                  How are they related to you? <span className="text-red-400">*</span>
                </label>
                <select
                  id="am-relationship"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  required
                  className="input-base mt-1 w-full"
                >
                  <option value="">Select relationship</option>
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="am-nickname" className="block text-sm font-medium text-[var(--muted)]">
                  What do you call them? <span className="text-[var(--muted)]">(optional)</span>
                </label>
                <input
                  id="am-nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="input-base mt-1 w-full"
                  placeholder="e.g., Mom, Dad, Grandma Sue, Uncle Joe"
                />
                <p className="mt-1 text-xs text-[var(--muted)]">
                  This is what shows throughout the app instead of full name.
                </p>
              </div>

              <div>
                <label htmlFor="am-email" className="block text-sm font-medium text-[var(--muted)]">
                  Email <span className="text-[var(--muted)]">(optional)</span>
                </label>
                <input
                  id="am-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base mt-1 w-full"
                  placeholder="their@email.com (for login when they sign up)"
                />
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Optional for kids. Parents can post on their behalf.
                </p>
              </div>

              <div>
                <label htmlFor="am-birth-date" className="block text-sm font-medium text-[var(--muted)]">
                  Birthday <span className="text-[var(--muted)]">(optional but encouraged)</span>
                </label>
                <input
                  id="am-birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="input-base mt-1 w-full"
                />
                <p className="mt-1 text-xs text-[var(--muted)]">
                  We&apos;ll remind you and can add it to Events.
                </p>
              </div>

              <div>
                <label htmlFor="am-birth-place" className="block text-sm font-medium text-[var(--muted)]">
                  Birth place <span className="text-[var(--muted)]">(optional)</span>
                </label>
                <input
                  id="am-birth-place"
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  className="input-base mt-1 w-full"
                  placeholder="e.g. Vancouver, BC"
                />
                <p className="mt-1 text-xs text-[var(--muted)]">Creates a balloon pin on the map.</p>
              </div>

              {linkMembers.length > 0 && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)]/50 p-3">
                  <h4 className="text-sm font-medium text-[var(--foreground)]">Link in family tree (optional)</h4>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">Connect this person to family members. You can add multiple links.</p>
                  <div className="mt-2 space-y-2">
                    {links.map((link, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <select
                          value={link.type}
                          onChange={(e) => {
                            const next = [...links];
                            next[i] = { ...next[i], type: e.target.value as "spouse" | "child" | "parent" };
                            setLinks(next);
                          }}
                          className="input-base min-h-0 flex-1 py-1.5 text-sm"
                        >
                          <option value="spouse">Spouse of</option>
                          <option value="child">Child of</option>
                          <option value="parent">Parent of</option>
                        </select>
                        <select
                          value={link.memberId}
                          onChange={(e) => {
                            const next = [...links];
                            next[i] = { ...next[i], memberId: e.target.value };
                            setLinks(next);
                          }}
                          className="input-base min-h-0 flex-1 py-1.5 text-sm"
                        >
                          <option value="">Select member</option>
                          {linkMembers.map((m) => (
                            <option key={m.id} value={m.id}>{m.nickname?.trim() || m.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setLinks(links.filter((_, j) => j !== i))}
                          className="shrink-0 rounded-md p-1.5 text-[var(--muted)] hover:bg-red-50 hover:text-red-500"
                          aria-label="Remove link"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setLinks([...links, { type: "child", memberId: "" }])}
                      className="text-sm font-medium text-[var(--accent)] hover:underline"
                    >
                      + Add link
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">
                  Profile photo <span className="text-[var(--muted)]">(optional)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_IMAGES}
                  onChange={handlePhotoChange}
                  className="mt-1 block w-full text-sm text-[var(--muted)] file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--accent)]/20 file:px-3 file:py-1.5 file:text-[var(--accent)]"
                />
                {photoPreview && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={photoPreview}
                      alt="Profile photo preview"
                      loading="lazy"
                      className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--border)]"
                    />
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="text-sm text-[var(--muted)] underline hover:text-[var(--foreground)]"
                    >
                      Remove photo
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Footer actions */}
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="order-2 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] sm:order-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="order-1 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] sm:order-none"
                >
                  {loading ? "Adding..." : "Add member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
