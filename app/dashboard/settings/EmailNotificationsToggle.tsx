"use client";

import { useState, useTransition } from "react";
import { toggleEmailNotifications } from "./actions";

export function EmailNotificationsToggle({
  enabled,
  memberId,
}: {
  enabled: boolean;
  memberId: string;
}) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !isEnabled;
    setIsEnabled(next); // optimistic update
    startTransition(async () => {
      const result = await toggleEmailNotifications(memberId, next);
      if (!result.success) {
        setIsEnabled(!next); // revert on failure
      }
    });
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-[var(--foreground)]">Email Notifications</p>
        <p className="text-sm text-[var(--muted)]">
          Birthday reminders, time capsule unlocks, weekly digest, and activity nudges
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isEnabled}
        onClick={handleToggle}
        disabled={isPending}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 ${
          isEnabled ? "bg-[var(--accent)]" : "bg-[var(--border)]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
            isEnabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
