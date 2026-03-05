"use client";

import { useRouter } from "next/navigation";
import { deleteTimeCapsule } from "./actions";
import { toast } from "sonner";

export function DeleteTimeCapsuleButton({ id, className = "" }: { id: string; className?: string }) {
  const router = useRouter();

  function handleDelete() {
    toast("Delete this letter? This cannot be undone.", {
      action: {
        label: "Delete",
        onClick: async () => {
          await deleteTimeCapsule(id);
          router.push("/dashboard/time-capsules");
          router.refresh();
        },
      },
      cancel: { label: "Cancel" },
      duration: 8000,
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className={`rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 ${className}`}
    >
      Delete
    </button>
  );
}
