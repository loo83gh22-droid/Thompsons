"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeVoiceMemo, updateVoiceMemo } from "./actions";
import { transcribeVoiceMemo } from "./transcribe";
import { EmptyStateGuide } from "@/app/components/EmptyStateGuide";

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
  transcript: string | null;
  transcription_status: string | null;
  transcribed_at: string | null;
};

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
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
  const [transcribingId, setTranscribingId] = useState<string | null>(null);

  async function handleRemove(id: string) {
    await removeVoiceMemo(id);
    setDeleteConfirmId(null);
    router.refresh();
  }

  if (!memos.length) {
    return (
      <EmptyStateGuide
        icon="🎙️"
        title="Voices are the most fleeting thing we have."
        description="A laugh. A bedtime story. The way someone says your name. Record it here — and it will last forever. Imagine your grandchildren hearing your voice decades from now."
        inspiration={[
          "Tell your favourite childhood story in your own words",
          "Sing the lullaby you sing to your kids every night",
          "Record an inside joke that only your family would get",
          "Leave a message to your future grandchildren — or great-grandchildren",
        ]}
        ctaLabel="Record your first voice memo"
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
            className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-shadow hover:shadow-md"
          >
            {/* Accent top strip */}
            <div className="h-[3px] bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]/40" />

            <div className="p-4 sm:p-5">
              {/* Header row */}
              <div className="flex items-start gap-3">
                {/* Mic icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <MicIcon />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold leading-tight text-[var(--foreground)]">
                      {memo.title}
                    </h2>
                    {memo.duration_seconds != null && (
                      <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--secondary)] px-2 py-0.5 text-xs text-[var(--muted)]">
                        {formatDuration(memo.duration_seconds)}
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-[var(--muted)]">
                    <span>🎙️ {byLabel}</span>
                    {forLabel && <span>· for {forLabel}</span>}
                    <span>· {dateStr}</span>
                  </div>
                </div>

                {/* Action buttons */}
                {isCreator && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(memo.id)}
                      className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                      aria-label="Edit"
                    >
                      ✏️
                    </button>
                    {deleteConfirmId === memo.id ? (
                      <span className="flex items-center gap-1 text-sm">
                        <button type="button" onClick={() => handleRemove(memo.id)} className="text-red-600 hover:underline">
                          Confirm
                        </button>
                        <button type="button" onClick={() => setDeleteConfirmId(null)} className="text-[var(--muted)] hover:underline">
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(memo.id)}
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              {memo.description && (
                <p className="mt-2.5 line-clamp-2 text-sm text-[var(--muted)]">{memo.description}</p>
              )}

              {/* Audio player */}
              <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                <audio
                  src={memo.audio_url}
                  controls
                  className="h-10 w-full"
                  preload="metadata"
                />
              </div>

              {/* Transcription */}
              {memo.transcript ? (
                <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-[var(--foreground)]">Transcript</h4>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(memo.transcript!)}
                      className="text-xs text-[var(--primary)] hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">{memo.transcript}</p>
                  {memo.transcribed_at && (
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Transcribed on {new Date(memo.transcribed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : memo.transcription_status === "processing" ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <span className="animate-spin inline-block">⏳</span> Transcribing audio…
                </p>
              ) : memo.transcription_status === "failed" ? (
                <div className="mt-3 flex items-center gap-2">
                  <p className="text-sm text-red-500">Transcription failed.</p>
                  <button
                    type="button"
                    onClick={async () => {
                      setTranscribingId(memo.id);
                      await transcribeVoiceMemo(memo.id);
                      setTranscribingId(null);
                      router.refresh();
                    }}
                    disabled={transcribingId === memo.id}
                    className="text-xs text-[var(--primary)] hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setTranscribingId(memo.id);
                    await transcribeVoiceMemo(memo.id);
                    setTranscribingId(null);
                    router.refresh();
                  }}
                  disabled={transcribingId === memo.id}
                  className="mt-3 text-sm font-medium text-[var(--primary)] hover:underline disabled:opacity-50"
                >
                  {transcribingId === memo.id ? "Transcribing…" : "✨ Transcribe this memo"}
                </button>
              )}
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
                <option value="">Select…</option>
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
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="btn-submit rounded-full bg-[var(--primary)] font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
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
