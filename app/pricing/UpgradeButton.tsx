"use client";

import { useState } from "react";
import { toast } from "sonner";
import { fbqTrack } from "@/app/components/MetaPixel";

export function UpgradeButton({
  plan,
  label,
  highlighted,
}: {
  plan: "monthly" | "annual" | "annual_founding" | "legacy";
  label: string;
  highlighted: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    fbqTrack("InitiateCheckout", { content_name: plan });
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If not authenticated, redirect to signup with the base plan
        if (res.status === 401) {
          const signupPlan = plan === "annual_founding" || plan === "monthly" ? "annual" : plan;
          window.location.href = `/login?mode=signup&plan=${signupPlan}`;
          return;
        }
        toast.error(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={`block w-full rounded-full px-6 py-3 text-center font-medium transition-all hover:scale-[1.02] disabled:opacity-50 ${
        highlighted
          ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
          : "border border-[var(--border)] text-[var(--foreground)] bg-[var(--secondary)] hover:bg-[var(--surface-hover)]"
      }`}
    >
      {loading ? "Loading..." : label}
    </button>
  );
}
