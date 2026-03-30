"use client";

import { useEffect, useState } from "react";

const MOTHERS_DAY_2026 = new Date("2026-05-10T00:00:00");

export function FoundingRateCountdown() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    function calc() {
      const diff = MOTHERS_DAY_2026.getTime() - Date.now();
      setDays(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
    }
    calc();
    const t = setInterval(calc, 60_000);
    return () => clearInterval(t);
  }, []);

  if (days === null || days <= 0) return null;

  return (
    <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
      Founding Family rate ends in {days} day{days !== 1 ? "s" : ""}. Goes to $349 after Mother&apos;s Day.
    </p>
  );
}
