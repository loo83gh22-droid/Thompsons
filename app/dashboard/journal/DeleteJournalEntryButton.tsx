"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteJournalEntry } from "./actions";

interface DeleteJournalEntryButtonProps {
  entryId: string;
  title: string;
  variant?: "list" | "edit";
}

export function DeleteJournalEntryButton({
  entryId,
  title,
  variant = "list",
}: DeleteJournalEntryButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const message =
      variant === "edit"
        ? "Are you sure you want to delete this entry? Photos and perspectives will be removed. This cannot be undone."
        : `Delete "${title}"? This cannot be undone.`;
    if (!confirm(message)) return;

    setDeleting(true);
    try {
      await deleteJournalEntry(entryId);
      router.push("/dashboard/journal");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  }

  if (variant === "edit") {
    return (
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete entry"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 hover:border-red-200 disabled:opacity-50"
    >
      {deleting ? "…" : "Delete"}
    </button>
  );
}
