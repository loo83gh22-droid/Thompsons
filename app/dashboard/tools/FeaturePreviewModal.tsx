"use client";

import { useEffect } from "react";
import type { CatalogFeature } from "@/src/lib/feature-catalog";

type Props = {
  feature: CatalogFeature;
  isEnabled: boolean;
  isToggling: boolean;
  canManage: boolean;
  onToggle: (slug: string) => void;
  onClose: () => void;
};

export function FeaturePreviewModal({ feature, isEnabled, isToggling, canManage, onToggle, onClose }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-t-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl sm:rounded-2xl">
        <button onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          aria-label="Close">
          ✕
        </button>

        <div className="flex items-center gap-4">
          <span className="text-5xl">{feature.icon}</span>
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--foreground)]">{feature.name}</h2>
            {isEnabled && feature.available && (
              <span className="mt-1 inline-block rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs font-medium text-white">
                Active
              </span>
            )}
          </div>
        </div>

        <p className="mt-4 text-[var(--muted)]">{feature.description}</p>

        {feature.highlights && feature.highlights.length > 0 && (
          <ul className="mt-4 space-y-2">
            {feature.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                <span className="mt-0.5 shrink-0 text-[var(--accent)]">✓</span>
                {h}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6">
          {!feature.available ? (
            <span className="inline-block rounded-full bg-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)]">
              Coming soon
            </span>
          ) : canManage ? (
            <button
              onClick={() => { onToggle(feature.slug); onClose(); }}
              disabled={isToggling}
              className={`w-full rounded-full py-2.5 text-sm font-medium transition-all ${
                isEnabled
                  ? "bg-[var(--border)] text-[var(--muted)] hover:bg-red-100 hover:text-red-600"
                  : "bg-[var(--accent)] text-white hover:brightness-110"
              } disabled:opacity-60`}
            >
              {isEnabled ? "Remove from Nest" : "Add to Nest"}
            </button>
          ) : isEnabled ? (
            <p className="text-center text-sm text-[var(--muted)]">This feature is active.</p>
          ) : (
            <p className="text-center text-sm text-[var(--muted)]">Ask an adult to enable this feature.</p>
          )}
        </div>
      </div>
    </div>
  );
}
