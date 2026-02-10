"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeVoiceMemo, updateVoiceMemo } from "./actions";
import { EmptyState } from "../components/EmptyState";

type MemberRow = { name: string; nickname: string | null; relationship: string | null };

type VoiceMemo = {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  duration_seconds: number | null;
  recorded_date: string | null;
  created_at: string;
  family_member_id: string | null;
  recorded_for_id: string | null;
  recorded_by: MemberRow | MemberRow[] | null;
  recorded_for: MemberRow | MemberRow[] | null;
};

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function one<T>(x: T | T[] | null): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? x[0] ?? null : x;
}

export function VoiceMemoList({
  memos,
  currentUserMemberId,
  members,
}: {
  memos: VoiceMemo[];
  currentUserMemberId: string | null;
  members: { id: string; name: string; nickname: string | null; relationship: string | null }[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  async function handleRemove(id: string) {
    await removeVoiceMemo(id);
    setDeleteConfirmId(null);
    router.refresh();
  }

  if (!memos.length) {
    return (
      <EmptyState
        icon="🎙️"
        headline="No voice memos yet"
        description="Record voices for the future—stories, songs, jokes. Imagine kids hearing their great-grandmother's voice decades from now."
        actionLabel="Record your first memory"
        onAction={() => document.querySelector<HTMLButtonElement>("[data-voice-memo-add]")?.click()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {memos.map((memo) => {
        const by = one(memo.recorded_by);
        const forMember = one(memo.recorded_for);
        const byDisplayName = by ? (by.nickname?.trim() || by.name) : null;
        const byLabel = byDisplayName && by
          ? by.relationship
            ? `${byDisplayName} (${by.relationship})`
            : byDisplayName
          : "Unknown";
        const forLabel = forMember
          ? forMember.relationship
            ? `${forMember.nickname?.trim() || forMember.name} (${forMember.relationship})`
            : forMember.nickname?.trim() || forMember.name
          : null;
        const dateStr = formatDate(memo.recorded_date ?? memo.created_at);
        const isCreator = currentUserMemberId != null && memo.family_member_id === currentUserMemberId;

        return (
          <article
            key={memo.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl" aria-hidden="true">
                    🎙️
                  </span>
                  {isCreator && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(memo.id)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                        aria-label="Edit"
                      >
                        ✏️
                      </button>
                      {deleteConfirmId === memo.id ? (
                        <span className="flex items-center gap-1 text-sm">
                          <button
                            type="button"
                            onClick={() => handleRemove(memo.id)}
                            className="text-red-400 hover:underline"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-[var(--muted)] hover:underline"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(memo.id)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--muted)] hover:bg-red-500/10 hover:text-red-400"
                          aria-label="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
                  {memo.title}
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  Recorded by {byLabel} on {dateStr}
                </p>
                {memo.duration_seconds != null && (
                  <p className="text-sm text-[var(--muted)]">
                    Duration: {formatDuration(memo.duration_seconds)}
                  </p>
                )}
                {forMember && forLabel && (
                  <p className="text-sm text-[var(--muted)]">
                    For {forLabel}
                  </p>
                )}
                {memo.description && (
                  <p className="line-clamp-2 text-sm text-[var(--muted)]">{memo.description}</p>
                )}
              </div>
              <div className="w-full min-w-0 flex-shrink-0 sm:w-auto">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2">
                  <audio
                    src={memo.audio_url}
                    controls
                    className="h-10 w-full max-w-full"
                    preload="metadata"
                  />
                </div>
              </div>
            </div>
          </article>
        );
      })}

      {editingId && (
        <EditVoiceMemoModal
          memo={memos.find((m) => m.id === editingId)!}
          members={members}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function EditVoiceMemoModal({
  memo,
  members,
  onClose,
  onSaved,
}: {
  memo: VoiceMemo;
  members: { id: string; name: string; nickname: string | null; relationship: string | null }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(memo.title);
  const [recordedById, setRecordedById] = useState(memo.family_member_id ?? "");
  const [recordedForId, setRecordedForId] = useState(memo.recorded_for_id ?? "");
  const [recordedDate, setRecordedDate] = useState(
    memo.recorded_date ? memo.recorded_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState(memo.description ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!recordedById) {
      setError("Please select who recorded this.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateVoiceMemo(memo.id, {
        title: title.trim().slice(0, 100),
        recordedById,
        recordedForId: recordedForId || null,
        recordedDate,
        description: description.trim().slice(0, 500) || null,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" aria-hidden onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-voice-memo-title"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 id="edit-voice-memo-title" className="font-display text-lg font-semibold text-[var(--foreground)]">
              Edit voice memo
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-vm-title" className="block text-sm font-medium text-[var(--muted)]">
                What is this recording? *
              </label>
              <input
                id="edit-vm-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="input-base mt-1"
              />
            </div>
            <div>
              <label htmlFor="edit-vm-by" className="block text-sm font-medium text-[var(--muted)]">
                Who recorded this? *
              </label>
              <select
                id="edit-vm-by"
                value={recordedById}
                onChange={(e) => setRecordedById(e.target.value)}
                className="input-base mt-1"
              >
                <option value="">Select...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.relationship ? `${m.name} (${m.relationship})` : m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-vm-for" className="block text-sm font-medium text-[var(--muted)]">
                Who is this for?
              </label>
              <select
                id="edit-vm-for"
                value={recordedForId}
                onChange={(e) => setRecordedForId(e.target.value)}
                className="input-base mt-1"
              >
                <option value="">Select someone (optional)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.relationship ? `${m.name} (${m.relationship})` : m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-vm-date" className="block text-sm font-medium text-[var(--muted)]">
                Date *
              </label>
              <input
                id="edit-vm-date"
                type="date"
                value={recordedDate}
                onChange={(e) => setRecordedDate(e.target.value)}
                className="input-base mt-1"
              />
            </div>
            <div>
              <label htmlFor="edit-vm-desc" className="block text-sm font-medium text-[var(--muted)]">
                Notes
              </label>
              <textarea
                id="edit-vm-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                className="input-base mt-1 min-h-[80px] resize-y"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="btn-submit rounded-lg bg-[var(--accent)] font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50"
              >
                {loading ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
