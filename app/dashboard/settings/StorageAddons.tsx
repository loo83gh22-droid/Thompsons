"use client";

import { useState } from "react";
import { HardDrive, Plus, CheckCircle } from "lucide-react";

type ActiveAddon = {
  id: string;
  label: string;
  bytes_added: number;
  price_per_year_usd: number;
  status: string;
  grace_until?: string | null;
};

type AddonTier = {
  plan: "storage_25gb" | "storage_75gb" | "storage_150gb";
  label: string;
  gb: number;
  priceUsd: number;
  note: string;
};

const ADDON_TIERS: AddonTier[] = [
  {
    plan: "storage_25gb",
    label: "+25 GB",
    gb: 25,
    priceUsd: 9,
    note: "Great for photo-heavy families",
  },
  {
    plan: "storage_75gb",
    label: "+75 GB",
    gb: 75,
    priceUsd: 24,
    note: "Add video without worry",
  },
  {
    plan: "storage_150gb",
    label: "+150 GB",
    gb: 150,
    priceUsd: 49,
    note: "Best for regular video uploads",
  },
];

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb % 1 === 0 ? gb : gb.toFixed(1)} GB`;
}

function AddonPurchaseButton({ tier }: { tier: AddonTier }) {
  const [loading, setLoading] = useState(false);

  async function handlePurchase() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: tier.plan }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong. Please try again.");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-4 py-2 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10 disabled:opacity-50"
    >
      <Plus className="h-3.5 w-3.5" />
      {loading ? "Loading..." : `Add ${tier.label} — $${tier.priceUsd}/yr`}
    </button>
  );
}

export function StorageAddons({ activeAddons }: { activeAddons: ActiveAddon[] }) {
  const totalAddonBytes = activeAddons.reduce((sum, a) => sum + a.bytes_added, 0);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-display text-xl font-semibold">Storage Add-ons</h2>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Expand your storage beyond your plan&apos;s included 50 GB. Each add-on renews annually.
        </p>
      </div>

      <div className="space-y-6 px-6 py-5">
        {/* Active add-ons */}
        {activeAddons.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-medium text-[var(--foreground)]">
              Active add-ons
              <span className="ml-2 text-[var(--muted)]">
                ({formatBytes(totalAddonBytes)} extra)
              </span>
            </p>
            <ul className="space-y-2">
              {activeAddons.map((addon) => {
                const isCancelling = addon.status === "cancelling";
                const graceDate = addon.grace_until
                  ? new Date(addon.grace_until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : null;
                return (
                  <li
                    key={addon.id}
                    className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm ${
                      isCancelling
                        ? "border-[var(--warning)]/50 bg-[var(--warning)]/5"
                        : "border-[var(--border)] bg-[var(--secondary)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${isCancelling ? "text-[var(--warning)]" : "text-emerald-500"}`} />
                      <div>
                        <span className="font-medium text-[var(--foreground)]">{addon.label}</span>
                        {isCancelling && graceDate && (
                          <p className="text-xs text-[var(--warning)]">Cancelling — grace period ends {graceDate}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[var(--muted)]">
                      {isCancelling ? "Cancelling" : `$${addon.price_per_year_usd}/yr`}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-[var(--muted)]">
              To cancel an add-on, use{" "}
              <span className="font-medium text-[var(--foreground)]">Manage Billing</span> in your plan section above.
            </p>
          </div>
        )}

        {/* Available add-ons */}
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--foreground)]">
            Add more storage
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {ADDON_TIERS.map((tier) => {
              const alreadyOwned = activeAddons.some(
                (a) => a.label === tier.label
              );
              return (
                <div
                  key={tier.plan}
                  className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-4"
                >
                  <span className="font-display text-xl font-bold text-[var(--accent)]">
                    {tier.label}
                  </span>
                  <span className="mt-0.5 text-sm font-medium text-[var(--foreground)]">
                    ${tier.priceUsd}
                    <span className="text-[var(--muted)]">/year</span>
                  </span>
                  <span className="mt-1 text-xs text-[var(--muted)]">{tier.note}</span>
                  {alreadyOwned ? (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Active
                    </div>
                  ) : (
                    <AddonPurchaseButton tier={tier} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Storage tip */}
        <div className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <span className="mt-0.5 text-base" aria-hidden="true">💡</span>
          <p className="text-sm text-[var(--muted)]">
            <span className="font-medium text-[var(--foreground)]">Before adding storage,</span>{" "}
            check your uploads — a single unedited video can be several gigabytes.
            Deleting large files you no longer need is often the fastest way to free up room.
          </p>
        </div>

        {/* Cancellation policy */}
        <div className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <span className="mt-0.5 text-base" aria-hidden="true">ℹ️</span>
          <p className="text-sm text-[var(--muted)]">
            <span className="font-medium text-[var(--foreground)]">Cancellation policy:</span>{" "}
            If you cancel a storage add-on and your usage exceeds your base plan limit, you&apos;ll have a{" "}
            <span className="font-medium text-[var(--foreground)]">30-day grace period</span> to reduce your storage.
            After that, your largest media files will be removed to bring you within your limit.{" "}
            Journal entries, stories, and recipes are <span className="font-medium text-[var(--foreground)]">never deleted</span>.
          </p>
        </div>
      </div>
    </section>
  );
}
