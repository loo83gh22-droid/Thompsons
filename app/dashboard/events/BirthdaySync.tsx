"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureBirthdayEvents } from "./actions";

export function BirthdaySync() {
  const router = useRouter();
  const [toast, setToast] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    ensureBirthdayEvents().then(({ added }) => {
      if (mounted && added > 0) setToast(added);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (toast === null) return;
    router.refresh();
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast, router]);

  if (toast === null || toast === 0) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border border-[var(--accent)]/40 bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)] shadow-lg sm:left-auto sm:right-4"
      role="status"
    >
      We auto-added {toast} birthday{toast === 1 ? "" : "s"} from your family members!
    </div>
  );
}
