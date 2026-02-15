"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAgeTransitions, changeMemberRole } from "./members/actions";
import { ROLE_LABELS, type MemberRole } from "@/src/lib/roles";

type Transition = {
  id: string;
  name: string;
  currentRole: MemberRole;
  suggestedRole: MemberRole;
  age: number;
};

const DISMISSED_KEY = "age-transition-dismissed";

export function AgeTransitionBanner() {
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    // Load dismissed IDs from localStorage
    try {
      const saved = localStorage.getItem(DISMISSED_KEY);
      if (saved) setDismissed(new Set(JSON.parse(saved)));
    } catch {
      // ignore
    }

    checkAgeTransitions().then(setTransitions).catch(() => {});
  }, []);

  const visible = transitions.filter((t) => !dismissed.has(t.id));
  if (!visible.length) return null;

  async function handleUpgrade(t: Transition) {
    setUpdating(t.id);
    try {
      await changeMemberRole(t.id, t.suggestedRole);
      setTransitions((prev) => prev.filter((x) => x.id !== t.id));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdating(null);
    }
  }

  function handleDismiss(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-3">
      {visible.map((t) => (
        <div
          key={t.id}
          className="flex flex-col gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[var(--foreground)]">
              🎂 {t.name} just turned {t.age}!
            </p>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              {t.suggestedRole === "teen"
                ? `They can now have their own Teen account with limited access. Would you like to upgrade them from ${ROLE_LABELS[t.currentRole]} to ${ROLE_LABELS[t.suggestedRole]}?`
                : `They're now an adult and can have full access. Would you like to upgrade them from ${ROLE_LABELS[t.currentRole]} to ${ROLE_LABELS[t.suggestedRole]}?`}
            </p>
            {t.suggestedRole === "teen" && (
              <p className="mt-1 text-xs text-[var(--muted)]">
                You&apos;ll be prompted to add their email so they can create their own login.
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => handleUpgrade(t)}
              disabled={updating === t.id}
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {updating === t.id ? "Upgrading..." : `Upgrade to ${ROLE_LABELS[t.suggestedRole]}`}
            </button>
            <button
              type="button"
              onClick={() => handleDismiss(t.id)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)]"
            >
              Later
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
