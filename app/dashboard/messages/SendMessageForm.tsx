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
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-5">
      <div>
        <label htmlFor="message-title" className="block text-sm font-medium text-[var(--muted)]">
          Title
        </label>
        <input
          id="message-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Happy Valentine's Day!"
          className="input-base mt-1"
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="message-content" className="block text-sm font-medium text-[var(--muted)]">
          Message
        </label>
        <textarea
          id="message-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={6}
          placeholder="Write your message..."
          className="input-base mt-1 min-h-[120px] resize-y"
        />
      </div>

      <div>
        <label htmlFor="message-show-on-date" className="block text-sm font-medium text-[var(--muted)]">
          Show on date <span className="text-[var(--muted)]/70">(optional)</span>
        </label>
        <input
          id="message-show-on-date"
          type="date"
          value={showOnDate}
          onChange={(e) => setShowOnDate(e.target.value)}
          className="input-base mt-1"
          aria-describedby="message-date-hint"
        />
        <p id="message-date-hint" className="mt-1 text-xs text-[var(--muted)]">
          Leave empty to show on next login. Set a date (e.g. Feb 14) for Valentine&apos;s Day.
        </p>
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-[var(--muted)]">Send to</legend>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Leave all unchecked to send to everyone. Or select specific people.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {familyMembers.map((m) => (
            <label
              key={m.id}
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-3 transition-colors has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)]/10 focus-within:ring-2 focus-within:ring-[var(--accent)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--background)]"
            >
              <input
                type="checkbox"
                checked={recipientIds.includes(m.id)}
                onChange={() => toggleRecipient(m.id)}
                className="h-4 w-4 rounded border-[var(--border)]"
                aria-label={`Send to ${m.name}`}
              />
              <span>{m.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="btn-submit rounded-lg bg-[var(--accent)] font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] inline-flex items-center justify-center gap-2"
      >
        {loading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--background)] border-t-transparent" aria-hidden="true" />}
        {loading ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
