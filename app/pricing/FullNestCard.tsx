"use client";

import { useState } from "react";
import { UpgradeButton } from "./UpgradeButton";

const FEATURES = [
  "Everything in Free, unlimited members",
  "5 GB storage included (add more anytime)",
  "2 videos per journal entry",
  "Full data export (archive download)",
  "Nest Keeper designation",
  "Storage add-ons available",
];

export function FullNestCard() {
  const [isMonthly, setIsMonthly] = useState(false);

  return (
    <div className="relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
      {/* Founding member badge */}
      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--primary-foreground)]">
        Founding Member Rate
      </span>

      {/* Tier name */}
      <h2 className="font-display text-2xl font-bold text-[var(--foreground)]">
        The Full Nest
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Unlimited everything for your family.
      </p>

      {/* Monthly / Annual toggle */}
      <div className="mt-5 flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 w-fit">
        <button
          onClick={() => setIsMonthly(false)}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            !isMonthly
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Annual
        </button>
        <button
          onClick={() => setIsMonthly(true)}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            isMonthly
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Price */}
      <div className="mt-5 flex items-baseline gap-1">
        {isMonthly ? (
          <>
            <span className="font-display text-5xl font-bold text-[var(--accent)]">$6.99</span>
            <span className="text-base text-[var(--muted)]">/month</span>
          </>
        ) : (
          <>
            <span className="font-display text-5xl font-bold text-[var(--accent)]">$49</span>
            <span className="text-base text-[var(--muted)]">/year</span>
          </>
        )}
      </div>

      {/* Price context */}
      <p className="mt-1.5 text-sm font-medium text-[var(--muted)]">
        {isMonthly ? (
          <>Switch to annual and save 42%. Just $4.08/month.</>
        ) : (
          <>
            <span className="line-through opacity-60">$79/year</span>
            {" "}founding member rate - 4¢ a day
          </>
        )}
      </p>

      {/* Divider */}
      <hr className="my-6 border-[var(--border)]" />

      {/* Features */}
      <ul className="flex-1 space-y-3 text-sm">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[var(--primary)]"
              aria-hidden="true"
            >
              ✓
            </span>
            <span className="text-[var(--foreground)]">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-8">
        <UpgradeButton
          plan={isMonthly ? "monthly" : "annual_founding"}
          label={isMonthly ? "Start Monthly Plan" : "Get Founding Member Rate"}
          highlighted={false}
        />
        {!isMonthly && (
          <p className="mt-2 text-center text-xs text-[var(--muted)]">
            Limited spots. Price goes to $79/yr when founding rate ends.
          </p>
        )}
      </div>
    </div>
  );
}
