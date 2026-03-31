"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/client";
import { compressImage } from "@/src/lib/compressImage";
import { upsertBabyBookMonth, deleteBabyBookMonth } from "../actions";
import {
  getPromptsForAgeMonths,
  formatEntryMonth,
  toEntryMonthString,
  ageInMonths,
} from "../prompts";

type Entry = {
  id: string;
  entry_month: string;
  photo_url: string | null;
  photo_path: string | null;
  photo_size_bytes: number;
  story: string | null;
};

type MonthCell = {
  year: number;
  month: number; // 0-based
  label: string;
  entryMonthStr: string;
  ageMonths: number;
  entry: Entry | null;
};

function buildMonthCells(birthDate: string | null): MonthCell[] {
  const cells: MonthCell[] = [];
  const now = new Date();

  const start = birthDate
    ? new Date(birthDate + "T12:00:00")
    : new Date(now.getFullYear() - 1, now.getMonth(), 1);

  const startYear = start.getFullYear();
  const startMonth = start.getMonth();

  for (let y = startYear; y <= now.getFullYear(); y++) {
    const mStart = y === startYear ? startMonth : 0;
    const mEnd = y === now.getFullYear() ? now.getMonth() : 11;
    for (let m = mStart; m <= mEnd; m++) {
      const d = new Date(y, m, 1);
      const ageMs = birthDate ? ageInMonths(birthDate, d) : 0;
      cells.push({
        year: y,
        month: m,
        label: d.toLocaleDateString(undefined, { month: "short", year: "numeric" }),
        entryMonthStr: toEntryMonthString(y, m),
        ageMonths: ageMs,
        entry: null,
      });
    }
  }

  return cells.reverse(); // newest first
}

export function MonthGrid({
  memberId,
  memberName,
  birthDate,
  entries,
}: {
  memberId: string;
  memberName: string;
  birthDate: string | null;
  entries: Entry[];
}) {
  const entryMap = new Map(entries.map((e) => [e.entry_month.slice(0, 7), e]));
  const cells = buildMonthCells(birthDate).map((c) => ({
    ...c,
    entry: entryMap.get(c.entryMonthStr.slice(0, 7)) ?? null,
  }));

  const [activeCell, setActiveCell] = useState<MonthCell & { entry: Entry | null } | null>(null);

  function openCell(cell: (typeof cells)[0]) {
    setActiveCell(cell);
  }

  function closeEditor() {
    setActiveCell(null);
  }

  if (cells.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-12 text-center text-sm text-[var(--muted)]">
        Add a birth date for {memberName} to start their baby book.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {cells.map((cell) => (
          <button
            key={cell.entryMonthStr}
            type="button"
            onClick={() => openCell(cell)}
            className={`group relative overflow-hidden rounded-xl border text-left transition-all hover:shadow-md ${
              cell.entry
                ? "border-[var(--border)] bg-[var(--card)]"
                : "border-dashed border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]"
            }`}
          >
            {/* Photo or placeholder */}
            <div className="relative aspect-square w-full bg-[var(--surface)]">
              {cell.entry?.photo_url ? (
                <Image
                  src={cell.entry.photo_url}
                  alt={`${memberName}, ${cell.label}`}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl opacity-30 group-hover:opacity-60 transition-opacity">
                  +
                </div>
              )}
            </div>

            {/* Month label */}
            <div className="px-2.5 py-2">
              <p className="text-xs font-semibold text-[var(--foreground)]">{cell.label}</p>
              {cell.entry?.story && (
                <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--muted)] leading-snug">
                  {cell.entry.story}
                </p>
              )}
              {!cell.entry && (
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">Add a memory</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Editor modal */}
      {activeCell && (
        <MonthEntryEditor
          memberId={memberId}
          memberName={memberName}
          cell={activeCell}
          onClose={closeEditor}
        />
      )}
    </>
  );
}

// ─── Entry editor ─────────────────────────────────────────────────────────────

function MonthEntryEditor({
  memberId,
  memberName,
  cell,
  onClose,
}: {
  memberId: string;
  memberName: string;
  cell: MonthCell & { entry: Entry | null };
  onClose: () => void;
}) {
  const prompts = getPromptsForAgeMonths(cell.ageMonths);
  const [story, setStory] = useState(cell.entry?.story ?? "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(cell.entry?.photo_url ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  function appendPrompt(text: string) {
    const prefix = story.trim() ? story.trim() + "\n\n" : "";
    setStory(prefix + text + " ");
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      let photoUrl: string | undefined;
      let photoPath: string | undefined;
      let photoSizeBytes: number | undefined;

      if (pendingFile) {
        const supabase = createClient();
        const compressed = await compressImage(pendingFile);
        const ext = compressed.name.split(".").pop() || "jpg";
        const path = `${memberId}/${cell.entryMonthStr}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("baby-book-photos")
          .upload(path, compressed, { upsert: true });
        if (uploadErr) {
          setError("Photo upload failed. Please try again.");
          return;
        }
        photoUrl = `/api/storage/baby-book-photos/${path}`;
        photoPath = path;
        photoSizeBytes = compressed.size;
      }

      const result = await upsertBabyBookMonth({
        memberId,
        entryMonth: cell.entryMonthStr,
        story,
        ...(photoUrl !== undefined && { photoUrl, photoPath, photoSizeBytes }),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  function handleDelete() {
    if (!cell.entry) return;
    setDeleting(true);
    startTransition(async () => {
      const res = await deleteBabyBookMonth(cell.entry!.id, memberId);
      setDeleting(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
    });
  }

  const ageLabel = cell.ageMonths === 0
    ? "Newborn"
    : cell.ageMonths < 24
    ? `${cell.ageMonths} months old`
    : `${Math.floor(cell.ageMonths / 12)} years old`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden max-h-[95dvh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-5 py-4">
          <div>
            <p className="font-semibold text-[var(--foreground)]">
              {formatEntryMonth(cell.entryMonthStr)}
            </p>
            <p className="text-xs text-[var(--muted)]">{memberName} · {ageLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Photo */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Favourite photo this month
            </label>
            {photoPreview ? (
              <div className="relative w-full overflow-hidden rounded-xl border border-[var(--border)]" style={{ aspectRatio: "4/3" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Month photo"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => { setPhotoPreview(null); setPendingFile(null); }}
                  className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white hover:bg-black/80"
                >
                  Change
                </button>
              </div>
            ) : (
              <label className="flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
                <span className="text-3xl">📷</span>
                <span className="text-sm">Tap to add a photo</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          {/* Story */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              What happened this month?
            </label>
            <textarea
              rows={5}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Write anything. Even one line is worth keeping."
              className="input-base w-full resize-y"
            />

            {/* Prompt chips */}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => appendPrompt(prompts.milestone)}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {prompts.milestone}
              </button>
              <button
                type="button"
                onClick={() => appendPrompt(prompts.evergreen)}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {prompts.evergreen}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-[var(--muted)]">Tap a prompt to add it as a starting line.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="min-h-[44px] flex-1 rounded-full bg-[var(--primary)] px-6 py-2.5 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="min-h-[44px] rounded-full border border-[var(--border)] px-5 py-2.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)] disabled:opacity-60"
            >
              Cancel
            </button>
          </div>

          {/* Delete */}
          {cell.entry && (
            <div className="border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending || deleting}
                className="text-sm text-red-500 hover:underline disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete this entry"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
