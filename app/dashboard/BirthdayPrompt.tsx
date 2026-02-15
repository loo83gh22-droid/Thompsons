"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { checkRecentBirthdays, checkRecentHolidays, type RecentBirthday, type RecentHoliday } from "./actions";

const DISMISSED_KEY = "birthday-prompts-dismissed";

export function BirthdayPrompt() {
  const [birthdays, setBirthdays] = useState<RecentBirthday[]>([]);
  const [holidays, setHolidays] = useState<RecentHoliday[]>([]);
  const [dismissed, setDismissed] = useState(true); // Hidden until loaded

  useEffect(() => {
    async function loadPrompts() {
      try {
        const [birthdaysData, holidaysData] = await Promise.all([
          checkRecentBirthdays(),
          checkRecentHolidays(),
        ]);

        // Check localStorage for dismissed prompts
        const dismissedStr = localStorage.getItem(DISMISSED_KEY);
        const dismissedSet = new Set<string>(
          dismissedStr ? JSON.parse(dismissedStr) : []
        );

        // Filter out already dismissed
        const activeBirthdays = birthdaysData.filter(
          (b) => !dismissedSet.has(`birthday-${b.date}-${b.memberId}`)
        );
        const activeHolidays = holidaysData.filter(
          (h) => !dismissedSet.has(`holiday-${h.date}`)
        );

        setBirthdays(activeBirthdays);
        setHolidays(activeHolidays);

        // Show modal if there are any active prompts
        if (activeBirthdays.length > 0 || activeHolidays.length > 0) {
          setDismissed(false);
        }
      } catch {
        // Silently fail
      }
    }

    loadPrompts();
  }, []);

  function handleDismiss(type: "birthday" | "holiday", id: string) {
    try {
      const dismissedStr = localStorage.getItem(DISMISSED_KEY);
      const dismissedList: string[] = dismissedStr
        ? JSON.parse(dismissedStr)
        : [];

      const key = type === "birthday" ? `birthday-${id}` : `holiday-${id}`;
      if (!dismissedList.includes(key)) {
        dismissedList.push(key);
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedList));
      }

      // Remove from state
      if (type === "birthday") {
        setBirthdays((prev) => prev.filter((b) => `${b.date}-${b.memberId}` !== id));
      } else {
        setHolidays((prev) => prev.filter((h) => h.date !== id));
      }

      // If no more prompts, hide modal
      const remainingBirthdays = birthdays.filter(
        (b) => `${b.date}-${b.memberId}` !== id
      );
      const remainingHolidays = holidays.filter((h) => h.date !== id);
      if (remainingBirthdays.length === 0 && remainingHolidays.length === 0) {
        setDismissed(true);
      }
    } catch {
      // Silently fail
    }
  }

  function handleDismissAll() {
    try {
      const dismissedStr = localStorage.getItem(DISMISSED_KEY);
      const dismissedList: string[] = dismissedStr
        ? JSON.parse(dismissedStr)
        : [];

      birthdays.forEach((b) => {
        const key = `birthday-${b.date}-${b.memberId}`;
        if (!dismissedList.includes(key)) {
          dismissedList.push(key);
        }
      });

      holidays.forEach((h) => {
        const key = `holiday-${h.date}`;
        if (!dismissedList.includes(key)) {
          dismissedList.push(key);
        }
      });

      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedList));
      setDismissed(true);
    } catch {
      // Silently fail
    }
  }

  if (dismissed || (birthdays.length === 0 && holidays.length === 0)) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="birthday-prompt-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
        <button
          onClick={handleDismissAll}
          className="absolute right-4 top-4 rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          aria-label="Dismiss all"
        >
          ✕
        </button>

        <h2
          id="birthday-prompt-title"
          className="font-display text-2xl font-bold text-[var(--foreground)]"
        >
          🎉 Capture the Moment!
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Recent celebrations in your family — write a journal entry to remember them!
        </p>

        <div className="mt-6 space-y-4">
          {birthdays.map((birthday) => (
            <div
              key={`${birthday.date}-${birthday.memberId}`}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--foreground)]">
                    🎂 {birthday.memberName}'s Birthday
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {birthday.relationship} •{" "}
                    {birthday.daysAgo === 0
                      ? "Today"
                      : birthday.daysAgo === 1
                      ? "Yesterday"
                      : `${birthday.daysAgo} days ago`}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleDismiss("birthday", `${birthday.date}-${birthday.memberId}`)
                  }
                  className="shrink-0 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  Dismiss
                </button>
              </div>
              <Link
                href={`/dashboard/journal/new?about=${encodeURIComponent(
                  birthday.memberName
                )}&date=${birthday.date}`}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110"
                onClick={() =>
                  handleDismiss("birthday", `${birthday.date}-${birthday.memberId}`)
                }
              >
                Write Journal Entry →
              </Link>
            </div>
          ))}

          {holidays.map((holiday) => (
            <div
              key={holiday.date}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--foreground)]">
                    ✨ {holiday.holidayName}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {holiday.daysAgo === 0
                      ? "Today"
                      : holiday.daysAgo === 1
                      ? "Yesterday"
                      : `${holiday.daysAgo} days ago`}
                  </p>
                </div>
                <button
                  onClick={() => handleDismiss("holiday", holiday.date)}
                  className="shrink-0 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  Dismiss
                </button>
              </div>
              <Link
                href={`/dashboard/journal/new?event=${encodeURIComponent(
                  holiday.holidayName
                )}&date=${holiday.date}`}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110"
                onClick={() => handleDismiss("holiday", holiday.date)}
              >
                Write Journal Entry →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
