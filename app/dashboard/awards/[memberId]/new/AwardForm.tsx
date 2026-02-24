"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createAward, updateAward } from "../../actions";

const CATEGORIES = [
  { value: "sports", label: "Sports" },
  { value: "academic", label: "Academic" },
  { value: "professional", label: "Professional" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
];

type ExistingFile = { id: string; url: string; file_type: string; file_name: string | null; sort_order: number };
type FamilyMember = { id: string; name: string; nickname: string | null };

type Props = {
  defaultMemberId: string;
  allMembers: FamilyMember[];
  // Edit mode
  awardId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialCategory?: string;
  initialAwardedBy?: string;
  initialAwardDate?: string;
  initialMemberIds?: string[];
  existingFiles?: ExistingFile[];
  onDeleteFile?: (fileId: string) => Promise<void>;
  onDone?: () => void;
};

export function AwardForm({
  defaultMemberId,
  allMembers,
  awardId,
  initialTitle = "",
  initialDescription = "",
  initialCategory = "other",
  initialAwardedBy = "",
  initialAwardDate = "",
  initialMemberIds,
  existingFiles = [],
  onDeleteFile,
  onDone,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState(initialCategory);
  const [awardedBy, setAwardedBy] = useState(initialAwardedBy);
  const [awardDate, setAwardDate] = useState(initialAwardDate);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(initialMemberIds ?? [defaultMemberId])
  );

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<Map<number, string>>(new Map());
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  function toggleMember(id: string) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const totalExisting = existingFiles.length + selectedFiles.length;
    const remaining = Math.max(0, 5 - totalExisting);
    const toAdd = files.slice(0, remaining);

    const newPreviews = new Map(imagePreviews);
    const startIdx = selectedFiles.length;

    toAdd.forEach((file, i) => {
      if (file.type.startsWith("image/")) {
        newPreviews.set(startIdx + i, URL.createObjectURL(file));
      }
    });

    setSelectedFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews(newPreviews);
    e.target.value = "";
  }

  function removeNewFile(index: number) {
    const preview = imagePreviews.get(index);
    if (preview) URL.revokeObjectURL(preview);

    const newPreviews = new Map<number, string>();
    imagePreviews.forEach((url, idx) => {
      if (idx < index) newPreviews.set(idx, url);
      else if (idx > index) newPreviews.set(idx - 1, url);
    });

    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews(newPreviews);
  }

  async function handleDeleteExisting(fileId: string) {
    if (!onDeleteFile) return;
    setDeletingFileId(fileId);
    try {
      await onDeleteFile(fileId);
    } finally {
      setDeletingFileId(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set("title", title);
    fd.set("description", description);
    fd.set("category", category);
    fd.set("awarded_by", awardedBy);
    fd.set("award_date", awardDate);
    for (const id of selectedMemberIds) fd.append("member_ids", id);
    for (const file of selectedFiles) fd.append("files", file);

    startTransition(async () => {
      const result = awardId
        ? await updateAward(awardId, fd)
        : await createAward(fd);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (onDone) {
        onDone();
      } else {
        router.push(`/dashboard/awards/${defaultMemberId}/${result.id}`);
      }
      router.refresh();
    });
  }

  const totalFiles = existingFiles.length + selectedFiles.length;
  const canAddMore = totalFiles < 5;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-6 sm:px-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* Files */}
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
          Photos &amp; Documents{" "}
          <span className="font-normal text-xs text-[var(--muted)]">(up to 5 — images or PDFs)</span>
        </label>

        <div className="flex flex-wrap gap-3">
          {/* Existing files */}
          {existingFiles.map((file) => (
            <div
              key={file.id}
              className="group relative h-24 w-24 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]"
            >
              {file.file_type === "image" ? (
                <Image
                  src={file.url}
                  alt="Award file"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 px-1">
                  <span className="text-2xl">📄</span>
                  <span className="line-clamp-2 text-center text-[10px] text-[var(--muted)]">
                    {file.file_name ?? "Document"}
                  </span>
                </div>
              )}
              {onDeleteFile && (
                <button
                  type="button"
                  onClick={() => handleDeleteExisting(file.id)}
                  disabled={deletingFileId === file.id}
                  className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {deletingFileId === file.id ? "…" : "✕"}
                </button>
              )}
            </div>
          ))}

          {/* New file previews */}
          {selectedFiles.map((file, i) => {
            const preview = imagePreviews.get(i);
            return (
              <div
                key={`new-${i}`}
                className="group relative h-24 w-24 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]"
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 px-1">
                    <span className="text-2xl">📄</span>
                    <span className="line-clamp-2 text-center text-[10px] text-[var(--muted)]">
                      {file.name}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeNewFile(i)}
                  className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* Add file button */}
          {canAddMore && (
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
              <span className="text-2xl">+</span>
              <span className="text-xs">Photo/Doc</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                multiple
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="award-title" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
          Award title <span className="text-red-500">*</span>
        </label>
        <input
          id="award-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`e.g. "Baseball Tournament 1st Place", "50 Under 50", "Dean's List"`}
          className="input-base w-full"
        />
      </div>

      {/* Awarded by + Date row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="award-by" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            Awarded by{" "}
            <span className="font-normal text-xs text-[var(--muted)]">(optional)</span>
          </label>
          <input
            id="award-by"
            type="text"
            value={awardedBy}
            onChange={(e) => setAwardedBy(e.target.value)}
            placeholder="e.g. Springfield Little League, Forbes"
            className="input-base w-full"
          />
        </div>

        <div>
          <label htmlFor="award-date" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            Date received{" "}
            <span className="font-normal text-xs text-[var(--muted)]">(optional)</span>
          </label>
          <input
            id="award-date"
            type="date"
            value={awardDate}
            onChange={(e) => setAwardDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="input-base w-full"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                category === cat.value
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="award-desc" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
          Description{" "}
          <span className="font-normal text-xs text-[var(--muted)]">(optional)</span>
        </label>
        <textarea
          id="award-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="The story behind the award, what it means, any details worth remembering…"
          className="input-base w-full resize-y"
        />
      </div>

      {/* Recipients */}
      {allMembers.length > 1 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Awarded to
          </label>
          <div className="flex flex-wrap gap-2">
            {allMembers.map((m) => {
              const checked = selectedMemberIds.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    checked
                      ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                  }`}
                  aria-pressed={checked}
                >
                  {checked && <span aria-hidden="true">✓</span>}
                  {m.nickname || m.name}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            Select everyone who received this award.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="min-h-[44px] rounded-full bg-[var(--primary)] px-6 py-2.5 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : awardId ? "Save changes" : "Save award"}
        </button>
        <button
          type="button"
          onClick={() => (onDone ? onDone() : router.back())}
          className="min-h-[44px] rounded-full border border-[var(--border)] px-5 py-2.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
