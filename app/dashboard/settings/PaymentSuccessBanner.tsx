"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function PaymentSuccessBanner({ planName }: { planName: string }) {
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || searchParams.get("payment") !== "success") return null;

  return (
    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 text-center">
          <p className="font-display text-lg font-semibold text-emerald-800">
            Welcome to {planName}! Your upgrade is active.
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            All your new features are ready to use. Thank you for growing your Family Nest!
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg p-1 text-emerald-400 hover:bg-emerald-100 hover:text-emerald-600"
          aria-label="Dismiss"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4l10 10M14 4L4 14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
