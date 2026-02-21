"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import { updateFamilyMember, deleteFamilyMember } from "./actions";
import { RELATIONSHIP_OPTIONS } from "./constants";

const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp,image/gif";

export type Member = {
  id: string;
  name: string;
  nickname: string | null;
  relationship: string | null;
  contact_email: string | null;
  user_id: string | null;
  birth_date: string | null;
  birth_place: string | null;
  avatar_url: string | null;
};

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatBirthdayShort(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const d = new Date(birthDate + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MemberList({ members }: { members: Member[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((m) => (
        <MemberCard key={m.id} member={m} />
      ))}
    </div>
  );
}

function MemberCard({ member }: { member: Member }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(member.name);
  const [relationship, setRelationship] = useState(member.relationship ?? "");
  const [nickname, setNickname] = useState(member.nickname ?? "");
  const [email, setEmail] = useState(member.contact_email ?? "");
  const [birthDate, setBirthDate] = useState(member.birth_date ?? "");
  const [birthPlace, setBirthPlace] = useState(member.birth_place ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(member.avatar_url);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function clearNewPhoto() {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (!relationship.trim()) {
      setMessage({ type: "error", text: "Please select a relationship." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      let finalAvatarUrl = avatarUrl;
      if (photoFile) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `members/${user.id}_${member.id}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("member-photos")
          .upload(path, photoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("member-photos").getPublicUrl(path);
        finalAvatarUrl = publicUrl;
      }

      const result = await updateFamilyMember(
        member.id,
        name.trim(),
        relationship.trim(),
        email.trim() || "",
        birthDate || "",
        birthPlace.trim() || "",
        nickname.trim() || null,
        finalAvatarUrl
      );
      setAvatarUrl(finalAvatarUrl);
      clearNewPhoto();
      setMessage({
        type: "success",
        text: result?.birthdayEventAdded ? "Updated. Birthday added to Family Events!" : "Updated.",
      });
      setEditing(false);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }
    setLoading(true);
    try {
      await deleteFamilyMember(member.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
      setConfirmRemove(false);
    }
  }

  const displayPhoto = photoPreview || avatarUrl;
  const photoOrInitials = displayPhoto ? (
    <img
      src={displayPhoto}
      alt={member.name}
      loading="lazy"
      className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--border)]"
    />
  ) : (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)]/30 text-lg font-semibold text-[var(--accent)]">
      {initials(member.name)}
    </div>
  );

  if (editing) {
    return (
      <form
        onSubmit={handleUpdate}
        className="rounded-xl border border-[var(--accent)]/50 bg-[var(--surface)] p-4 sm:p-6"
      >
        <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">Edit member</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">Profile photo</label>
            <div className="mt-2 flex items-center gap-3">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={`New profile photo for ${member.name}`}
                  loading="lazy"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--border)]"
                />
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Current profile photo of ${member.name}`}
                  loading="lazy"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--border)]"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--muted)]">
                  No photo
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_IMAGES}
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-[var(--muted)] file:rounded file:border-0 file:bg-[var(--accent)]/20 file:px-2 file:py-1 file:text-[var(--accent)]"
                />
                {photoPreview && (
                  <button type="button" onClick={clearNewPhoto} className="mt-1 text-xs text-[var(--muted)] underline">
                    Clear new photo
                  </button>
                )}
              </div>
            </div>
          </div>
          <div>
            <label htmlFor={`name-${member.id}`} className="block text-sm font-medium text-[var(--muted)]">Full name *</label>
            <input
              id={`name-${member.id}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-base mt-1 w-full"
              placeholder="e.g. Sarah"
            />
          </div>
          <div>
            <label htmlFor={`relationship-${member.id}`} className="block text-sm font-medium text-[var(--muted)]">How are they related to you? *</label>
            <select
              id={`relationship-${member.id}`}
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
            <label htmlFor={`nickname-${member.id}`} className="block text-sm font-medium text-[var(--muted)]">What do you call them? (optional)</label>
            <input
              id={`nickname-${member.id}`}
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input-base mt-1 w-full"
              placeholder="e.g., Mom, Grandma Sue"
            />
          </div>
          <div>
            <label htmlFor={`email-${member.id}`} className="block text-sm font-medium text-[var(--muted)]">Email (optional)</label>
            <input
              id={`email-${member.id}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base mt-1 w-full"
              placeholder="their@email.com"
            />
          </div>
          <div>
            <label htmlFor={`birth-date-${member.id}`} className="block text-sm font-medium text-[var(--muted)]">Birthday (optional)</label>
            <input
              id={`birth-date-${member.id}`}
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="input-base mt-1 w-full"
            />
          </div>
          <div>
            <label htmlFor={`birth-place-${member.id}`} className="block text-sm font-medium text-[var(--muted)]">Birth place (optional)</label>
            <input
              id={`birth-place-${member.id}`}
              type="text"
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              className="input-base mt-1 w-full"
              placeholder="e.g. Vancouver, BC"
            />
          </div>
          {message && (
            <div className={`rounded-lg px-4 py-2 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message.text}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={loading} className="btn-submit rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50">
              {loading ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => { setEditing(false); clearNewPhoto(); }} disabled={loading} className="btn-secondary rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-hover)] disabled:opacity-50">
              Cancel
            </button>
          </div>
        </div>
      </form>
    );
  }

  const shortBirthday = formatBirthdayShort(member.birth_date);

  // Status logic: signed in > pending invitation (has email, no account) > no badge
  const status = member.user_id
    ? "signed_in"
    : member.contact_email?.trim()
      ? "pending"
      : null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-shadow hover:shadow-lg">
      {/* Action buttons top-right */}
      <div className="mb-3 flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={loading}
          className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:opacity-50"
          title="Edit"
          aria-label="Edit member"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
        <button
          type="button"
          onClick={handleRemove}
          disabled={loading}
          className={`rounded-lg border p-1.5 disabled:opacity-50 ${
            confirmRemove
              ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
              : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-red-600"
          }`}
          title={confirmRemove ? "Click again to remove" : "Remove"}
          aria-label="Remove member"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>

      {/* Centered avatar */}
      <div className="flex justify-center">
        <Link href={`/dashboard/members/${member.id}`} className="shrink-0 rounded-full ring-2 ring-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.name}
              loading="lazy"
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary)]/15 text-lg font-semibold text-[var(--primary)]">
              {initials(member.name)}
            </div>
          )}
        </Link>
      </div>

      {/* Info centered below avatar */}
      <div className="mt-3 text-center">
        <Link href={`/dashboard/members/${member.id}`} className="font-display text-lg font-bold text-[var(--foreground)] hover:underline">
          {member.name}
        </Link>
        {member.nickname && (
          <p className="text-sm text-[var(--muted)]">&quot;{member.nickname}&quot;</p>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {member.relationship && (
            <span className="inline-block rounded-full bg-[var(--accent)]/20 px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
              {member.relationship}
            </span>
          )}
          {shortBirthday && (
            <span className="text-xs text-[var(--muted)]">Born {shortBirthday}</span>
          )}
        </div>
        {member.contact_email && (
          <p className="mt-1.5 truncate text-xs text-[var(--muted)]">{member.contact_email}</p>
        )}
        {status && (
          <div className="mt-2">
            {status === "signed_in" ? (
              <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">Signed In</span>
            ) : (
              <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">Pending Invitation</span>
            )}
          </div>
        )}
      </div>

      {confirmRemove && (
        <p className="mt-3 text-center text-sm text-[var(--muted)]">
          Remove {member.name}? Click the trash icon again to confirm.
        </p>
      )}
    </div>
  );
}
