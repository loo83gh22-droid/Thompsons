"use client";

import { useState, useEffect } from "react";
import { markMessageAsRead } from "./messages/actions";

type UnreadMessage = {
  id: string;
  title: string;
  content: string;
  show_on_date: string | null;
  created_at: string;
  sender: { name: string } | null;
};

export function MessagePopup({ messages, familyMemberId }: { messages: UnreadMessage[]; familyMemberId: string }) {
  const [visible, setVisible] = useState<UnreadMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setVisible(messages);
  }, [messages]);

  const current = visible[currentIndex];
  const hasMore = visible.length > 1;

  async function handleDismiss() {
    if (!current) return;
    await markMessageAsRead(current.id, familyMemberId);
    if (hasMore && currentIndex < visible.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setVisible((prev) => prev.filter((m) => m.id !== current.id));
      setCurrentIndex(0);
    }
  }

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="relative max-w-lg rounded-2xl border-2 border-[var(--accent)] bg-[var(--surface)] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[var(--foreground)]">
              {current.title}
            </h2>
            {current.sender?.name && (
              <p className="mt-1 text-sm text-[var(--muted)]">
                From {current.sender.name}
              </p>
            )}
          </div>
          {hasMore && (
            <span className="rounded-full bg-[var(--accent)]/20 px-2 py-1 text-xs font-medium text-[var(--accent)]">
              {currentIndex + 1} of {visible.length}
            </span>
          )}
        </div>
        <div className="whitespace-pre-wrap text-[var(--foreground)]/90">
          {current.content}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg bg-[var(--accent)] px-6 py-2 font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)]"
          >
            {hasMore ? "Next" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}
