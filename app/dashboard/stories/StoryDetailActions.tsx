"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { deleteStory } from "./actions";
import { PrintButton } from "./PrintButton";

export function StoryDetailActions({
  storyId,
  isAuthor,
}: {
  storyId: string;
  isAuthor: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard");
      }
    } catch (err) {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard");
      }
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this story? This cannot be undone.")) return;
    setDeleting(true);
    const result = await deleteStory(storyId);
    setDeleting(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.push("/dashboard/stories");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleShare}
        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-hover)]"
      >
        Share link
      </button>
      <PrintButton />
      {isAuthor && (
        <>
          <Link
            href={`/dashboard/stories/${storyId}/edit`}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-hover)]"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </>
      )}
      <Link
        href="/dashboard/stories"
        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-hover)]"
      >
        Back to stories
      </Link>
    </div>
  );
}
