"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function PaymentCancelledBanner() {
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || searchParams.get("payment") !== "cancelled") return null;

  return (
    <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-center">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-display text-lg font-semibold text-blue-800">
            No worries &mdash; your plan wasn&apos;t changed.
          </p>
          <p className="mt-1 text-sm text-blue-700">
            You can upgrade anytime when you&apos;re ready. Your current plan stays exactly as it is.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-600"
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
