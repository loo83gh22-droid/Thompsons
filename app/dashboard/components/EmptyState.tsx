"use client";

import Link from "next/link";

type EmptyStateProps = {
  icon: string;
  headline: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon,
  headline,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-4 py-10 text-center sm:px-6 sm:py-12">
      <span className="text-5xl" role="img" aria-hidden="true">
        {icon}
      </span>
      <h2 className="mt-4 font-display text-xl font-semibold text-[var(--foreground)]">
        {headline}
      </h2>
      <p className="mt-2 max-w-sm text-[var(--muted)] text-sm sm:text-base">
        {description}
      </p>
      {(actionLabel && (actionHref || onAction)) && (
        <div className="mt-6">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex touch-target min-h-[44px] w-full min-w-[44px] items-center justify-center rounded-full bg-[var(--primary)] px-6 py-3 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] sm:w-auto"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex touch-target min-h-[44px] w-full min-w-[44px] items-center justify-center rounded-full bg-[var(--primary)] px-6 py-3 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] sm:w-auto"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-8">
      {content}
    </div>
  );
}
