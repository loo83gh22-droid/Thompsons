"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { saveOneLineEntry, deleteOneLineEntry } from "./actions";

type Entry = { id: string; entry_date: string; content: string };

const MAX_CHARS = 140;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDisplayDate(dateStr: string) {
  const parts = dateStr.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${MONTH_NAMES[month]} ${day}, ${year}`;
}

function formatTodayHeading(dateStr: string) {
  const parts = dateStr.split("-");
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const year = parseInt(parts[0], 10);
  const d = new Date(year, month, day);
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  return `${weekday}, ${MONTH_NAMES[month]} ${day}`;
}

export function OneLineClient({
  today,
  todayEntry: initialTodayEntry,
  onThisDay,
  streak,
  totalEntries,
  recentDates,
}: {
  today: string;
  todayEntry: Entry | null;
  onThisDay: Entry[];
  streak: number;
  totalEntries: number;
  recentDates: string[];
}) {
  const [content, setContent] = useState(initialTodayEntry?.content ?? "");
  const [savedContent, setSavedContent] = useState(initialTodayEntry?.content ?? "");
  const [todayEntryId, setTodayEntryId] = useState(initialTodayEntry?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDirty = content.trim() !== savedContent.trim();
  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = content.length > MAX_CHARS;

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [content]);

  function handleSave() {
    if (!isDirty || isOverLimit || !content.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await saveOneLineEntry(today, content);
      if (result.success) {
        setSavedContent(content.trim());
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      } else {
        setError(result.error ?? "Failed to save");
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  }

  function handleDelete() {
    if (!todayEntryId) return;
    startTransition(async () => {
      await deleteOneLineEntry(todayEntryId);
      setContent("");
      setSavedContent("");
      setTodayEntryId(null);
    });
  }

  // Mini calendar: last 35 days
  const recentSet = new Set(recentDates);
  const calendarDays: { date: string; hasEntry: boolean; isToday: boolean }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today + "T00:00:00");
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    calendarDays.push({
      date: dateStr,
      hasEntry: recentSet.has(dateStr),
      isToday: dateStr === today,
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          One Line A Day
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          One sentence. Every day. Completely private — only you can read this.
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-6 flex gap-4">
        <div className="flex items-center gap-2 rounded-xl bg-[var(--surface)] px-4 py-2.5">
          <span className="text-xl">🔥</span>
          <div>
            <div className="text-lg font-bold leading-none text-[var(--foreground)]">{streak}</div>
            <div className="text-xs text-[var(--muted)]">day streak</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[var(--surface)] px-4 py-2.5">
          <span className="text-xl">📖</span>
          <div>
            <div className="text-lg font-bold leading-none text-[var(--foreground)]">{totalEntries}</div>
            <div className="text-xs text-[var(--muted)]">entries total</div>
          </div>
        </div>
      </div>

      {/* Today's entry */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
            {formatTodayHeading(today)}
          </h2>
          <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)]">
            Today
          </span>
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's one thing worth remembering today?"
          className={`w-full resize-none rounded-xl border bg-[var(--background)] px-4 py-3 text-base text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-colors focus:border-[var(--accent)] min-h-[80px] ${
            isOverLimit
              ? "border-red-400"
              : "border-[var(--border)]"
          }`}
          aria-label="Today's one-line entry"
        />

        <div className="mt-2 flex items-center justify-between gap-3">
          <span
            className={`text-xs tabular-nums ${
              isOverLimit
                ? "text-red-500 font-medium"
                : charsLeft <= 20
                  ? "text-amber-500"
                  : "text-[var(--muted)]"
            }`}
          >
            {isOverLimit ? `${Math.abs(charsLeft)} over limit` : `${charsLeft} left`}
          </span>

          <div className="flex items-center gap-2">
            {savedContent && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg px-3 py-2 text-xs text-[var(--muted)] hover:text-red-500 transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || isOverLimit || !content.trim() || isPending}
              className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving…" : justSaved ? "Saved ✓" : savedContent ? "Update" : "Save"}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}

        <p className="mt-3 text-xs text-[var(--muted)]">
          Tip: Press <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono text-[10px]">⌘↵</kbd> to save
        </p>
      </div>

      {/* 35-day calendar strip */}
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-medium text-[var(--muted)]">Last 5 weeks</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map(({ date, hasEntry, isToday }) => {
            const dayNum = parseInt(date.split("-")[2], 10);
            return (
              <div
                key={date}
                title={formatDisplayDate(date)}
                className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                  isToday
                    ? hasEntry
                      ? "bg-[var(--accent)] text-white ring-2 ring-[var(--accent)]/40"
                      : "ring-2 ring-[var(--accent)]/60 text-[var(--accent)] bg-[var(--accent)]/10"
                    : hasEntry
                      ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                      : "bg-[var(--surface)] text-[var(--muted)]"
                }`}
              >
                {dayNum}
              </div>
            );
          })}
        </div>
      </div>

      {/* On this day */}
      {onThisDay.length > 0 && (
        <div>
          <h3 className="mb-4 font-display text-lg font-semibold text-[var(--foreground)]">
            On this day, past years
          </h3>
          <div className="space-y-3">
            {onThisDay.map((entry) => {
              const year = entry.entry_date.split("-")[0];
              const yearsAgo = new Date().getFullYear() - parseInt(year, 10);
              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--accent)]">{year}</span>
                    <span className="text-xs text-[var(--muted)]">
                      · {yearsAgo === 1 ? "1 year ago" : `${yearsAgo} years ago`}
                    </span>
                  </div>
                  <p className="text-[var(--foreground)]">{entry.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {onThisDay.length === 0 && totalEntries > 0 && (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-5 py-6 text-center text-sm text-[var(--muted)]">
          No entries from this day in past years yet — come back next year to see them here.
        </div>
      )}
    </div>
  );
}
