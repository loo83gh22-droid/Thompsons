"use client";

import { useState, useRef } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { addFamilyMember } from "./actions";
import { RELATIONSHIP_OPTIONS } from "./constants";

const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp,image/gif";

export function AddMemberForm({ triggerClassName }: { triggerClassName?: string } = {}) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setMessage({ type: "error", text: "Please select how they are related to you." });
      return;
    }
    setLoading(true);
    setMessage(null);
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
        const { data: { publicUrl } } = supabase.storage.from("member-photos").getPublicUrl(path);
        avatarUrl = publicUrl;
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

      setName("");
      setRelationship("");
      setNickname("");
      setEmail("");
      setBirthDate("");
      setBirthPlace("");
      clearPhoto();

      let text = "Member added. Add another or close.";
      if (result?.birthdayEventAdded) text += " Birthday added to Family Events!";
      setMessage({ type: "success", text });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {open ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6"
        >
          <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">
            Add a member
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--muted)]">
                Full name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-base mt-1 w-full"
                placeholder="e.g. Sarah"
              />
            </div>
            <div>
              <label htmlFor="relationship" className="block text-sm font-medium text-[var(--muted)]">
                How are they related to you? <span className="text-red-400">*</span>
              </label>
              <select
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                required
                className="input-base mt-1 w-full"
              >
                <option value="">Select relationship</option>
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-[var(--muted)]">
                What do you call them? <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <input
                id="nickname"
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
              <label htmlFor="email" className="block text-sm font-medium text-[var(--muted)]">
                Email <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <input
                id="email"
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
              <label htmlFor="birth-date" className="block text-sm font-medium text-[var(--muted)]">
                Birthday <span className="text-[var(--muted)]">(optional but encouraged)</span>
              </label>
              <input
                id="birth-date"
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
              <label htmlFor="birth-place" className="block text-sm font-medium text-[var(--muted)]">
                Birth place <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <input
                id="birth-place"
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="input-base mt-1 w-full"
                placeholder="e.g. Vancouver, BC"
              />
              <p className="mt-1 text-xs text-[var(--muted)]">Creates a balloon pin on the map.</p>
            </div>
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
                    alt="Preview"
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
            {message && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "border border-red-500/30 bg-red-500/20 text-red-400"
                }`}
                role="alert"
              >
                {message.text}
              </div>
            )}
            <div className="form-actions-mobile flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="btn-submit order-1 rounded-lg bg-[var(--accent)] font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:order-none"
              >
                {loading ? "Adding..." : "Add"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary order-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:order-none"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={triggerClassName ?? "min-h-[44px] rounded-lg border border-[var(--accent)]/50 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"}
        >
          + Add member
        </button>
      )}
    </div>
  );
}
