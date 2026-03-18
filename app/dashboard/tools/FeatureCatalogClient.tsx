"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useFamily } from "@/app/dashboard/FamilyContext";
import {
  getFeaturesByCategory,
  type CatalogFeature,
} from "@/src/lib/feature-catalog";
import { toggleFeature } from "./actions";
import { canManageMembers } from "@/src/lib/roles";

export function FeatureCatalogClient({
  enabledSlugs: initialSlugs,
}: {
  enabledSlugs: string[];
}) {
  const { currentUserRole } = useFamily();
  const canManage = canManageMembers(currentUserRole); // owner or adult
  const categories = getFeaturesByCategory();
  const [enabledSet, setEnabledSet] = useState<Set<string>>(
    () => new Set(initialSlugs)
  );
  const [pending, startTransition] = useTransition();
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);

  function handleToggle(slug: string) {
    setTogglingSlug(slug);
    // Optimistic update
    setEnabledSet((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    startTransition(async () => {
      try {
        await toggleFeature(slug);
      } catch {
        // Revert on error
        setEnabledSet((prev) => {
          const next = new Set(prev);
          if (next.has(slug)) next.delete(slug);
          else next.add(slug);
          return next;
        });
      } finally {
        setTogglingSlug(null);
      }
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          Feature Catalog
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Add the features your family will actually use. Skip the rest.
        </p>
      </div>

      <div className="space-y-10">
        {categories.map(({ category, label, features }) => (
          <section key={category}>
            <h2 className="mb-4 font-display text-lg font-semibold text-[var(--foreground)]">
              {label}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.slug}
                  feature={feature}
                  isEnabled={enabledSet.has(feature.slug)}
                  isToggling={togglingSlug === feature.slug && pending}
                  canManage={canManage}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({
  feature,
  isEnabled,
  isToggling,
  canManage,
  onToggle,
}: {
  feature: CatalogFeature;
  isEnabled: boolean;
  isToggling: boolean;
  canManage: boolean;
  onToggle: (slug: string) => void;
}) {
  const isAvailable = feature.available;

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-6 transition-all ${
        isEnabled && isAvailable
          ? "border-[var(--accent)]/40 bg-[var(--surface)] shadow-sm"
          : "border-[var(--border)] bg-[var(--surface)]"
      } ${!isAvailable ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`text-3xl ${!isAvailable ? "grayscale" : ""}`}>
          {feature.icon}
        </span>
        {isEnabled && isAvailable && (
          <span className="shrink-0 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs font-medium text-white">
            Active
          </span>
        )}
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold">
        {isEnabled && isAvailable ? (
          <Link
            href={feature.href}
            className="hover:text-[var(--accent)] transition-colors"
          >
            {feature.name}
          </Link>
        ) : (
          feature.name
        )}
      </h3>

      <p className="mt-1 flex-1 text-sm text-[var(--muted)]">
        {feature.description}
      </p>

      <div className="mt-4">
        {!isAvailable ? (
          <span className="inline-block rounded-full bg-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)]">
            Coming soon
          </span>
        ) : canManage ? (
          <button
            type="button"
            onClick={() => onToggle(feature.slug)}
            disabled={isToggling}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              isEnabled
                ? "bg-[var(--border)] text-[var(--muted)] hover:bg-red-100 hover:text-red-600"
                : "bg-[var(--accent)] text-white hover:brightness-110"
            } ${isToggling ? "opacity-50" : ""}`}
          >
            {isToggling ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            {isEnabled ? "Remove" : "Add to Nest"}
          </button>
        ) : isEnabled ? (
          <Link
            href={feature.href}
            className="inline-block rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white hover:brightness-110 transition-all"
          >
            Open
          </Link>
        ) : (
          <span className="text-xs text-[var(--muted)]">
            Ask an adult to enable this feature
          </span>
        )}
      </div>
    </div>
  );
}
