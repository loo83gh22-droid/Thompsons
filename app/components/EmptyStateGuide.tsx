"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type EmptyStateGuideProps = {
  icon: ReactNode;
  title: string;
  description: string;
  inspiration: string[];
  ctaLabel: string;
  ctaHref?: string;
  onAction?: () => void;
};

export function EmptyStateGuide({
  icon,
  title,
  description,
  inspiration,
  ctaLabel,
  ctaHref,
  onAction,
}: EmptyStateGuideProps) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-full max-w-lg rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-5 py-10 text-center sm:px-8 sm:py-12">
        {/* Icon */}
        <span className="text-5xl" role="img" aria-hidden="true">
          {icon}
        </span>

        {/* Title */}
        <h2 className="mt-4 font-display text-xl font-semibold text-[var(--accent)]">
          {title}
        </h2>

        {/* Description */}
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
          {description}
        </p>

        {/* Inspiration box */}
        {inspiration.length > 0 && (
          <div className="mt-6 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-5 py-4 text-left">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Ideas to get started
            </p>
            <ul className="space-y-2">
              {inspiration.map((idea, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--foreground)]/80"
                >
                  <span
                    className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                    aria-hidden="true"
                  />
                  {idea}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8">
          {ctaHref ? (
            <Link
              href={ctaHref}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--background)] transition-colors hover:bg-[var(--accent)]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {ctaLabel}
            </Link>
          ) : onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--background)] transition-colors hover:bg-[var(--accent)]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {ctaLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
