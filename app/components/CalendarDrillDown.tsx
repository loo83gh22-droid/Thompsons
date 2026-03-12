"use client";

import { useState, useMemo, type ReactNode } from "react";
import { buildCalendar } from "@/src/lib/buildCalendar";

/* ── Chevron icon ─────────────────────────────────────────── */

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

/* ── Props ─────────────────────────────────────────────────── */

interface CalendarDrillDownProps<T> {
  items: T[];
  getDate: (item: T) => Date;
  renderCompactRow: (item: T) => ReactNode;
  sectionLabel?: string;
  countLabel?: (n: number) => string;
}

/* ── Component ─────────────────────────────────────────────── */

export function CalendarDrillDown<T>({
  items,
  getDate,
  renderCompactRow,
  sectionLabel = "Earlier entries",
  countLabel = (n) => `${n} ${n === 1 ? "entry" : "entries"}`,
}: CalendarDrillDownProps<T>) {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const calendar = useMemo(() => buildCalendar(items, getDate), [items, getDate]);

  function toggleYear(year: number) {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  function toggleMonth(key: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (calendar.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
        {sectionLabel}
      </h2>
      <div className="space-y-1">
        {calendar.map(({ year, months, entryCount }) => {
          const yearOpen = expandedYears.has(year);
          return (
            <div key={year}>
              <button
                type="button"
                onClick={() => toggleYear(year)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-hover)]"
              >
                <ChevronIcon open={yearOpen} />
                <span className="font-display text-lg font-semibold text-[var(--foreground)]">
                  {year}
                </span>
                <span className="ml-auto text-sm text-[var(--muted)]">
                  {countLabel(entryCount)}
                </span>
              </button>

              {yearOpen && (
                <div className="ml-4 space-y-0.5 border-l border-[var(--border)] pl-3">
                  {months.map(({ month, label, entries: monthEntries }) => {
                    const monthKey = `${year}-${month}`;
                    const monthOpen = expandedMonths.has(monthKey);
                    return (
                      <div key={monthKey}>
                        <button
                          type="button"
                          onClick={() => toggleMonth(monthKey)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--surface-hover)]"
                        >
                          <ChevronIcon open={monthOpen} />
                          <span className="font-medium text-[var(--foreground)]">
                            {label}
                          </span>
                          <span className="ml-auto text-xs text-[var(--muted)]">
                            {monthEntries.length}
                          </span>
                        </button>

                        {monthOpen && (
                          <div className="ml-4 space-y-1 border-l border-[var(--border)] py-1 pl-3">
                            {monthEntries.map((entry, i) => (
                              <div key={i}>{renderCompactRow(entry)}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
