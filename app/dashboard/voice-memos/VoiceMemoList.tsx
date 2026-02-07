"use client";

import { useRouter } from "next/navigation";
import { removeVoiceMemo } from "./actions";

type VoiceMemo = {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  family_members: { name: string } | { name: string }[] | null;
};

export function VoiceMemoList({ memos }: { memos: VoiceMemo[] }) {
  const router = useRouter();

  async function handleRemove(id: string) {
    await removeVoiceMemo(id);
    router.refresh();
  }

  if (!memos.length) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-16 text-center">
        <p className="text-[var(--muted)]">
          No voice memos yet. Add a recording—grandparents telling stories, parent singing a lullaby, or dad&apos;s terrible jokes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {memos.map((memo) => {
        const raw = memo.family_members as { name: string } | { name: string }[] | null;
        const member = Array.isArray(raw) ? raw[0] : raw;
        return (
          <div
            key={memo.id}
            className="group flex flex-wrap items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <audio
              controls
              src={memo.audio_url}
              className="h-10 flex-1 min-w-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-[var(--foreground)]">{memo.title}</h3>
              {member?.name && (
                <p className="text-sm text-[var(--muted)]">{member.name}</p>
              )}
              {memo.description && (
                <p className="mt-0.5 text-sm text-[var(--muted)]">{memo.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleRemove(memo.id)}
              className="rounded px-2 py-1 text-xs text-red-400 opacity-0 transition-opacity hover:bg-red-500/10 group-hover:opacity-100"
            >
              Remove
            </button>
          </div>
        );
      })}
    </div>
  );
}
