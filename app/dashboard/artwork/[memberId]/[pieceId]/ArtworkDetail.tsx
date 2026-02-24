"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteArtworkPiece, deleteArtworkPhoto, getOrCreateArtworkShareToken, sendArtworkShareEmail } from "../../actions";
import { ArtworkForm } from "../ArtworkForm";

const MEDIUM_LABELS: Record<string, string> = {
  drawing: "Drawing",
  painting: "Painting",
  craft: "Craft",
  sculpture: "Sculpture",
  digital: "Digital",
  other: "Other",
};

const MEDIUM_COLORS: Record<string, string> = {
  drawing: "bg-blue-100 text-blue-700",
  painting: "bg-purple-100 text-purple-700",
  craft: "bg-yellow-100 text-yellow-700",
  sculpture: "bg-orange-100 text-orange-700",
  digital: "bg-cyan-100 text-cyan-700",
  other: "bg-[var(--surface)] text-[var(--muted)]",
};

type Photo = { id: string; url: string; sort_order: number };

type Piece = {
  id: string;
  title: string;
  description: string | null;
  medium: string | null;
  date_created: string | null;
  age_when_created: number | null;
  created_at: string;
  share_token: string | null;
  artwork_photos: Photo[] | null;
};

/* ── Simple share sheet ── */
function ArtworkShareButton({
  pieceId,
  title,
  initialShareToken,
}: {
  pieceId: string;
  title: string;
  initialShareToken: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(
    initialShareToken
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/artwork/${initialShareToken}`
      : null
  );
  const [copied, setCopied] = useState(false);

  // Email sub-form state
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent" | "error">("idle");
  const [emailError, setEmailError] = useState("");

  async function handleOpen() {
    if (shareUrl) { setOpen(true); return; }
    setLoading(true);
    try {
      const { shareToken } = await getOrCreateArtworkShareToken(pieceId);
      setShareUrl(`${window.location.origin}/share/artwork/${shareToken}`);
      setOpen(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create share link");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleFacebook() {
    if (!shareUrl) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
  }

  function handleEmailToggle() {
    setEmailOpen((v) => !v);
    setEmailStatus("idle");
    setEmailError("");
  }

  async function handleEmailSend(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValue.trim()) return;
    setEmailSending(true);
    setEmailStatus("idle");
    setEmailError("");
    try {
      const result = await sendArtworkShareEmail(pieceId, emailValue.trim());
      if (result.success) {
        setEmailStatus("sent");
        setEmailValue("");
        setTimeout(() => setEmailStatus("idle"), 4000);
      } else {
        setEmailStatus("error");
        setEmailError(result.error ?? "Failed to send.");
      }
    } catch (err) {
      setEmailStatus("error");
      setEmailError(err instanceof Error ? err.message : "Failed to send.");
    } finally {
      setEmailSending(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setEmailOpen(false);
    setEmailStatus("idle");
    setEmailError("");
    setEmailValue("");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:opacity-50 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        {loading ? "Creating link…" : "Share"}
      </button>

      {open && shareUrl && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--foreground)]">Share this artwork</span>
            <button
              onClick={handleClose}
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-lg leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {/* Facebook */}
            <button
              type="button"
              onClick={handleFacebook}
              className="inline-flex items-center gap-2.5 rounded-lg bg-[#1877F2]/10 px-3.5 py-2 text-sm font-medium text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12z" />
              </svg>
              Post to Facebook
            </button>

            {/* Email — toggle inline form */}
            <button
              type="button"
              onClick={handleEmailToggle}
              className={`inline-flex items-center gap-2.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                emailOpen
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Send via email
            </button>

            {/* Inline email form */}
            {emailOpen && (
              <form onSubmit={handleEmailSend} className="flex flex-col gap-2 pt-1">
                <input
                  type="email"
                  required
                  placeholder="recipient@email.com"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={emailSending || !emailValue.trim()}
                  className="w-full rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {emailSending ? "Sending…" : "Send"}
                </button>
                {emailStatus === "sent" && (
                  <p className="text-xs text-green-600 text-center">✓ Email sent!</p>
                )}
                {emailStatus === "error" && (
                  <p className="text-xs text-red-500 text-center">{emailError || "Failed to send."}</p>
                )}
              </form>
            )}

            {/* Copy link */}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2.5 rounded-lg border border-[var(--border)] px-3.5 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ArtworkDetail({
  piece,
  memberId,
  memberName,
  birthDate,
}: {
  piece: Piece;
  memberId: string;
  memberName: string;
  birthDate: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [photos, setPhotos] = useState<Photo[]>(
    [...(piece.artwork_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  );

  async function handleDeletePhoto(photoId: string) {
    await deleteArtworkPhoto(photoId, piece.id, memberId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteArtworkPiece(piece.id, memberId);
      router.push(`/dashboard/artwork/${memberId}`);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Edit artwork</h2>
          <button
            onClick={() => setEditing(false)}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
        </div>
        <ArtworkForm
          memberId={memberId}
          memberName={memberName}
          birthDate={birthDate}
          pieceId={piece.id}
          initialTitle={piece.title}
          initialDescription={piece.description ?? ""}
          initialMedium={piece.medium ?? ""}
          initialDateCreated={piece.date_created ?? ""}
          initialAgeWhenCreated={piece.age_when_created}
          existingPhotos={photos}
          onDeletePhoto={handleDeletePhoto}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Photos */}
      {photos.length > 0 && (
        <div className={`grid gap-3 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightboxPhoto(photo.url)}
              className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
              style={{ aspectRatio: photos.length === 1 ? "4/3" : "1/1" }}
            >
              <Image
                src={photo.url}
                alt={piece.title}
                fill
                unoptimized
                className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </button>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="flex aspect-[4/3] max-h-80 items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] text-6xl">
          🖼️
        </div>
      )}

      {/* Details card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">
              {piece.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
              {piece.medium && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${MEDIUM_COLORS[piece.medium] ?? MEDIUM_COLORS.other}`}>
                  {MEDIUM_LABELS[piece.medium] ?? piece.medium}
                </span>
              )}
              {piece.age_when_created != null && (
                <span>Age {piece.age_when_created}</span>
              )}
              {piece.date_created && (
                <span>
                  {new Date(piece.date_created).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
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

        {piece.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
            {piece.description}
          </p>
        )}

        <div className="mt-5">
          <ArtworkShareButton
            pieceId={piece.id}
            title={piece.title}
            initialShareToken={piece.share_token}
          />
        </div>

        <div className="mt-4 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
          <Link href={`/dashboard/artwork/${memberId}`} className="hover:text-[var(--foreground)]">
            ← Back to {memberName}&apos;s portfolio
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute right-4 top-4 text-white/70 hover:text-white text-2xl"
            onClick={() => setLightboxPhoto(null)}
            aria-label="Close"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxPhoto}
            alt="Artwork"
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
