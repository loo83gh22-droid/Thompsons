"use client";

import Link from "next/link";

type PlanLimitBadgeProps = {
  /** Current count of items */
  used: number;
  /** Maximum allowed on free plan */
  limit: number;
  /** Label for the feature, e.g. "entries", "stories" */
  label: string;
};

/**
 * Subtle badge showing "X of Y [label] used" for free plan users.
 * Shows upgrade link when at or near limit.
 */
export function PlanLimitBadge({ used, limit, label }: PlanLimitBadgeProps) {
  const atLimit = used >= limit;
  const nearLimit = used >= limit - 1;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={
          atLimit
            ? "font-semibold text-red-600"
            : nearLimit
              ? "font-medium text-amber-600"
              : "text-[var(--muted)]"
        }
      >
        {used} of {limit} {label} used
      </span>
      {atLimit && (
        <Link
          href="/pricing"
          className="rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
        >
          Upgrade for unlimited
        </Link>
      )}
    </div>
  );
}
