"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteTrophy, deleteTrophyFile } from "../../actions";
import { TrophyForm } from "../new/TrophyForm";

const CATEGORY_LABELS: Record<string, string> = {
  sports: "Sports",
  academic: "Academic",
  professional: "Professional",
  community: "Community",
  achievement: "Achievement",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  sports: "bg-green-100 text-green-700",
  academic: "bg-blue-100 text-blue-700",
  professional: "bg-purple-100 text-purple-700",
  community: "bg-orange-100 text-orange-700",
  achievement: "bg-yellow-100 text-yellow-700",
  other: "bg-[var(--surface)] text-[var(--muted)]",
};

type TrophyFile = { id: string; url: string; file_type: string; file_name: string | null; sort_order: number };
type TrophyMember = { family_member_id: string };
type FamilyMember = { id: string; name: string; nickname: string | null };

type Trophy = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  awarded_by: string | null;
  award_date: string | null;
  created_at: string;
  award_files: TrophyFile[] | null;
  award_members: TrophyMember[] | null;
};

export function TrophyDetail({
  trophy,
  memberId,
  memberName,
  allMembers,
}: {
  trophy: Trophy;
  memberId: string;
  memberName: string;
  allMembers: FamilyMember[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<TrophyFile[]>(
    [...(trophy.award_files ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  );

  const memberMap: Record<string, string> = {};
  for (const m of allMembers) memberMap[m.id] = m.nickname || m.name;

  const awardedNames = (trophy.award_members ?? [])
    .map((m) => memberMap[m.family_member_id])
    .filter(Boolean);

  const currentMemberIds = (trophy.award_members ?? []).map((m) => m.family_member_id);

  async function handleDeleteFile(fileId: string) {
    await deleteTrophyFile(fileId, trophy.id, memberId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTrophy(trophy.id);
      router.push(`/dashboard/trophy-case/${memberId}`);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Edit trophy</h2>
          <button
            onClick={() => setEditing(false)}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
        </div>
        <TrophyForm
          defaultMemberId={memberId}
          allMembers={allMembers}
          trophyId={trophy.id}
          initialTitle={trophy.title}
          initialDescription={trophy.description ?? ""}
          initialCategory={trophy.category}
          initialAwardedBy={trophy.awarded_by ?? ""}
          initialAwardDate={trophy.award_date ?? ""}
          initialMemberIds={currentMemberIds}
          existingFiles={files}
          onDeleteFile={handleDeleteFile}
          onDone={() => setEditing(false)}
        />
      </div>
    );
  }

  const imageFiles = files.filter((f) => f.file_type === "image");
  const docFiles = files.filter((f) => f.file_type === "document");

  return (
    <div className="space-y-6">
      {imageFiles.length > 0 && (
        <div className={`grid gap-3 ${imageFiles.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
          {imageFiles.map((file) => (
            <button
              key={file.id}
              onClick={() => setLightboxUrl(file.url)}
              className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
              style={{ aspectRatio: imageFiles.length === 1 ? "4/3" : "1/1" }}
            >
              <Image
                src={file.url}
                alt={trophy.title}
                fill
                unoptimized
                className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </button>
          ))}
        </div>
      )}

      {docFiles.length > 0 && (
        <div className="space-y-2">
          {docFiles.map((file) => (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface)]"
            >
              <span className="text-2xl" aria-hidden="true">📄</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">
                  {file.file_name ?? "Document"}
                </p>
                <p className="text-xs text-[var(--muted)]">Click to open</p>
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-[var(--muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          ))}
        </div>
      )}

      {files.length === 0 && (
        <div className="flex aspect-[4/3] max-h-64 items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] text-6xl">
          🏆
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">
              {trophy.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  CATEGORY_COLORS[trophy.category] ?? CATEGORY_COLORS.other
                }`}
              >
                {CATEGORY_LABELS[trophy.category] ?? trophy.category}
              </span>
              {trophy.awarded_by && <span>by {trophy.awarded_by}</span>}
              {trophy.award_date && (
                <span>
                  {new Date(trophy.award_date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
            {awardedNames.length > 0 && (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Awarded to:{" "}
                <span className="text-[var(--foreground)]">{awardedNames.join(", ")}</span>
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setEditing(true)}
              className="min-h-[36px] rounded-full border border-[var(--border)] px-4 py-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              Edit
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="min-h-[36px] rounded-full border border-red-200 px-4 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-50"
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--muted)]">Sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="min-h-[36px] rounded-full bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
                >
                  {isPending ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-[36px] rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {trophy.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
            {trophy.description}
          </p>
        )}

        <div className="mt-4 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
          <Link href={`/dashboard/trophy-case/${memberId}`} className="hover:text-[var(--foreground)]">
            ← Back to {memberName}&apos;s trophy case
          </Link>
        </div>
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute right-4 top-4 text-white/70 hover:text-white text-2xl"
            onClick={() => setLightboxUrl(null)}
            aria-label="Close"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Trophy"
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
