"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function AddedToMapBanner() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get("addedToMap") === "1") setShow(true);
  }, [searchParams]);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 8000);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="status"
      className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-3"
    >
      <p className="text-sm font-medium text-[var(--foreground)]">
        Added to Family Map. <Link href="/dashboard/map" className="text-[var(--accent)] hover:underline">View map</Link>
      </p>
      <button
        type="button"
        onClick={() => setShow(false)}
        className="shrink-0 rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
