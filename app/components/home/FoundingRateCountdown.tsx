"use client";

import { useEffect, useState } from "react";

/**
 * FoundingRateCountdown — generic N-day countdown.
 *
 * Originally hardcoded to Mother's Day 2026. Now takes a target date
 * + a label prop so the same widget can drive any seasonal campaign
 * (Mother's Day, Father's Day, holidays, etc.). Hides itself once
 * the date passes — no negative-day rendering.
 */
export function FoundingRateCountdown({
  targetDate = "2026-05-10T00:00:00",
  label = "Founding Family rate ends in",
  occasion = "Mother's Day",
  newPrice = "$349",
}: {
  targetDate?: string;
  label?: string;
  occasion?: string;
  newPrice?: string;
} = {}) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    function calc() {
      const target = new Date(targetDate);
      const diff = target.getTime() - Date.now();
      setDays(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
    }
    calc();
    const t = setInterval(calc, 60_000);
    return () => clearInterval(t);
  }, [targetDate]);

  if (days === null || days <= 0) return null;

  return (
    <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
      {label} {days} day{days !== 1 ? "s" : ""}. Goes to {newPrice} after {occasion}.
    </p>
  );
}
