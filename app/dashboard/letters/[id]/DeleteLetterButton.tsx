"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLetter } from "../actions";

export function DeleteLetterButton({ letterId }: { letterId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteLetter(letterId);
      router.push("/dashboard/letters");
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--muted)]">Delete this letter?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
    >
      Delete
    </button>
  );
}
