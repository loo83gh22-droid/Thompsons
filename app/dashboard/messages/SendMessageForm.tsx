"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendFamilyMessage } from "./actions";

type FamilyMember = { id: string; name: string };

export function SendMessageForm({
  senderFamilyMemberId,
  familyMembers,
}: {
  senderFamilyMemberId?: string;
  familyMembers: FamilyMember[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [showOnDate, setShowOnDate] = useState("");
  const [sent, setSent] = useState(false);

  function toggleRecipient(id: string) {
    setRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!senderFamilyMemberId || !title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      await sendFamilyMessage(
        senderFamilyMemberId,
        title.trim(),
        content.trim(),
        recipientIds,
        showOnDate || undefined
      );
      setSent(true);
      setTitle("");
      setContent("");
      setRecipientIds([]);
      setShowOnDate("");
      router.refresh();
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  }

  if (!senderFamilyMemberId) {
    return (
      <p className="mt-8 text-[var(--muted)]">
        Link your account to a family member in the Family Tree to send messages.
      </p>
    );
  }

  if (sent) {
    return (
      <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
        <p className="font-medium text-emerald-400">Message sent!</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          It will pop up when recipients next log in.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 text-sm text-[var(--accent)] hover:underline"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--muted)]">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Happy Valentine's Day!"
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--muted)]">
          Message
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={6}
          placeholder="Write your message..."
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--muted)]">
          Show on date <span className="text-[var(--muted)]/70">(optional)</span>
        </label>
        <input
          type="date"
          value={showOnDate}
          onChange={(e) => setShowOnDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">
          Leave empty to show on next login. Set a date (e.g. Feb 14) for Valentine&apos;s Day.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--muted)]">
          Send to
        </label>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Leave all unchecked to send to everyone. Or select specific people.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {familyMembers.map((m) => (
            <label
              key={m.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 transition-colors has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)]/10"
            >
              <input
                type="checkbox"
                checked={recipientIds.includes(m.id)}
                onChange={() => toggleRecipient(m.id)}
                className="rounded border-[var(--border)]"
              />
              <span>{m.name}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
