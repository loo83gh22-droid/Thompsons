"use client";

import { useRouter } from "next/navigation";
import { deleteTimeCapsule } from "./actions";

export function DeleteTimeCapsuleButton({ id, className = "" }: { id: string; className?: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this letter? This cannot be undone.")) return;
    await deleteTimeCapsule(id);
    router.push("/dashboard/time-capsules");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className={`rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 ${className}`}
    >
      Delete
    </button>
  );
}
