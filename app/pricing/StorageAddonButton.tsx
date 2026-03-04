"use client";

import { useState } from "react";

export function StorageAddonButton({
  plan,
  label,
  priceUsd,
}: {
  plan: "storage_25gb" | "storage_75gb" | "storage_150gb";
  label: string;
  priceUsd: number;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          // Not logged in → send to signup
          window.location.href = `/login?mode=signup`;
          return;
        }
        if (res.status === 402 && data.code === "upgrade_required") {
          // Free plan → must pick a paid plan first
          window.location.href = `/pricing#pricing-grid`;
          return;
        }
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
      onClick={handleClick}
      disabled={loading}
      className="mt-3 w-full rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-4 py-2 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10 disabled:opacity-50"
    >
      {loading ? "Loading..." : `Add ${label} — $${priceUsd}/yr`}
    </button>
  );
}
