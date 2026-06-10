"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createQuickMemory } from "./journal/actions";

/**
 * FirstMemoryCapture — the empty-state activation surface.
 *
 * The single biggest drop-off in the funnel: a brand-new user lands on an
 * empty dashboard, the "write something" nudge sends them to the full
 * /journal/new form (title, date, location, photos, member tags behind an
 * "optional details" toggle), it feels like homework, and they bounce.
 *
 * This replaces that with a one-textarea capture right on the dashboard.
 * No navigation, no required fields beyond a sentence. The author and a
 * default title (today's date) are filled in server-side by
 * createQuickMemory. Goal: first memory saved in under 30 seconds.
 *
 * Shown only while the family has zero content. The moment the first
 * memory saves, the dashboard re-renders and this is replaced by the
 * normal onboarding/first-win flow.
 */

const PROMPT_CHIPS = [
  "Something that made us laugh today",
  "What everyone's into right now",
  "A small moment I don't want to forget",
];

export function FirstMemoryCapture({ firstName }: { firstName: string | null }) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  function applyChip(text: string) {
    setContent((prev) => (prev.trim() ? prev : `${text}: `));
    textareaRef.current?.focus();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    const result = await createQuickMemory(trimmed);
    if (!result.success) {
      setSubmitting(false);
      toast.error(result.error || "Couldn't save that — try again.");
      return;
    }
    // Brief celebratory beat, then refresh so the server component re-renders
    // with the new entry (this component unmounts; the first-win flow takes over).
    setSaved(true);
    setTimeout(() => router.refresh(), 1100);
  }

  if (saved) {
    return (
      <section className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] p-6 text-center">
        <div className="text-3xl" aria-hidden>🌱</div>
        <p className="mt-2 font-display text-lg font-semibold text-[var(--foreground)]">
          Saved. That&apos;s the first one.
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">Opening your Nest…</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--accent)]/25 bg-[var(--surface)]">
      <div className="h-1 w-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]" />
      <div className="p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--foreground)] sm:text-xl">
          {firstName ? `Let's put the first memory in, ${firstName}.` : "Let's put the first memory in."}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          One sentence is plenty — you&apos;ll be glad it&apos;s here a year from now.
        </p>

        <form onSubmit={onSubmit} className="mt-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            autoFocus
            placeholder="What's one thing about today?"
            className="w-full resize-none rounded-xl border px-4 py-3 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {PROMPT_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => applyChip(chip)}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white shadow transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
            >
              {submitting ? "Saving…" : "Save this memory"}
            </button>
            <span className="text-xs text-[var(--muted)]">Takes 30 seconds.</span>
          </div>
        </form>
      </div>
    </section>
  );
}
