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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((m, i) => (
        <MemberCard key={m.id} member={m} index={i} />
      ))}
    </div>
  );
}

function MemberCard({ member, index }: { member: Member; index: number }) {
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
    <div
      className="group relative overflow-hidden rounded-3xl border border-[var(--border)]/60 bg-gradient-to-b from-[var(--card)] to-[var(--surface)] p-6 text-center opacity-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
      style={{ animation: `fade-in-up 0.5s ease-out ${index * 80}ms forwards` }}
    >
      {/* Decorative top accent bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

      {/* Floating action buttons */}
      <div className="absolute right-3 top-3 flex gap-1.5 rounded-xl bg-[var(--card)]/80 p-1 opacity-100 backdrop-blur-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={loading}
          className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] disabled:opacity-50"
          title="Edit"
          aria-label="Edit member"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
        <button
          type="button"
          onClick={handleRemove}
          disabled={loading}
          className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
            confirmRemove
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "text-[var(--muted)] hover:bg-red-50 hover:text-red-500"
          }`}
          title={confirmRemove ? "Click again to remove" : "Remove"}
          aria-label="Remove member"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>

      {/* Avatar with status indicator */}
      <Link href={`/dashboard/members/${member.id}`} className="group/avatar relative mx-auto block w-fit rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
        <div className="relative">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.name}
              loading="lazy"
              className="h-24 w-24 rounded-full object-cover ring-4 ring-[var(--accent)]/15 transition-all duration-300 group-hover/avatar:ring-[var(--accent)]/30"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/15 text-xl font-bold text-[var(--primary)] ring-4 ring-[var(--primary)]/10 transition-all duration-300 group-hover/avatar:ring-[var(--primary)]/25">
              {initials(member.name)}
            </div>
          )}
          {/* Online / pending status dot */}
          {status && (
            <span
              className={`absolute bottom-1 right-1 block h-4 w-4 rounded-full border-2 border-[var(--card)] ${
                status === "signed_in" ? "bg-emerald-400" : "bg-amber-400"
              }`}
              title={status === "signed_in" ? "Signed in" : "Pending invitation"}
            />
          )}
        </div>
      </Link>

      {/* Name */}
      <Link href={`/dashboard/members/${member.id}`} className="mt-4 block">
        <h3 className="font-display text-lg font-bold text-[var(--foreground)] transition-colors hover:text-[var(--accent)]">
          {member.name}
        </h3>
      </Link>

      {/* Nickname */}
      {member.nickname && (
        <p className="mt-0.5 text-sm italic text-[var(--muted)]">
          &ldquo;{member.nickname}&rdquo;
        </p>
      )}

      {/* Relationship badge */}
      {member.relationship && (
        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[var(--accent)]">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          {member.relationship}
        </span>
      )}

      {/* Details */}
      <div className="mt-4 space-y-1.5">
        {shortBirthday && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-[var(--muted)]">
            <svg className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A1.75 1.75 0 003 15.546m18-3.046V9a2 2 0 00-2-2h-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2H9V5a2 2 0 00-2-2H5a2 2 0 00-2 2v2H1a2 2 0 00-2 2v3.5" /></svg>
            <span>Born {shortBirthday}</span>
          </div>
        )}
        {member.contact_email && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-[var(--muted)]">
            <svg className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span className="truncate">{member.contact_email}</span>
          </div>
        )}
      </div>

      {/* Status label (small, subtle) */}
      {status && (
        <div className="mt-4">
          {status === "signed_in" ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Invited
            </span>
          )}
        </div>
      )}

      {confirmRemove && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Remove {member.name}? Tap trash again to confirm.
        </p>
      )}
    </div>
  );
}
