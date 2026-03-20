"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AddLocationForm } from "./AddLocationForm";
import { MapFirstVisitBanner } from "./MapFirstVisitBanner";
import { useFamily } from "@/app/dashboard/FamilyContext";
import type { MapFilter } from "./MapComponent";

// Leaflet map loads client-side only (no SSR)
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center rounded-xl bg-[var(--surface)]">
      <span className="text-[var(--muted)]">Loading map...</span>
    </div>
  ),
});

const DEFAULT_FILTER: MapFilter = {
  birth: true,
  homes: true,
  vacation: true,
  memorableEvent: true,
  other: true,
  visits: true,
};

const LEGEND = [
  { color: "#ec4899", label: "Our roots", symbol: "balloons" },
  { color: "#22c55e", label: "Home base", symbol: "house" },
  { color: "#f97316", label: "The trip", symbol: "vacation" },
  { color: "#ef4444", label: "The moment", symbol: "memorable_event" },
  { color: "#3b82f6", label: "The tradition", symbol: "pin" },
  { color: "#6b7280", label: "Other", symbol: "circle" },
];

const PIN_DESCRIPTIONS = [
  {
    label: "Our roots",
    color: "#ec4899",
    symbol: "balloons",
    description: "Where your family was born. The starting point of every story.",
  },
  {
    label: "Home base",
    color: "#22c55e",
    symbol: "house",
    description: "Places you've called home, whether for a year or a lifetime.",
  },
  {
    label: "The trip",
    color: "#f97316",
    symbol: "vacation",
    description: "Vacations, getaways, adventures. Anywhere you packed a bag.",
  },
  {
    label: "The moment",
    color: "#ef4444",
    symbol: "memorable_event",
    description: "Milestones tied to a place — weddings, graduations, reunions.",
  },
  {
    label: "The tradition",
    color: "#3b82f6",
    symbol: "pin",
    description: "Places you kept returning to. The same beach every summer.",
  },
  {
    label: "Other",
    color: "#6b7280",
    symbol: "circle",
    description: "Everything else — school, first job, that one random stop.",
  },
];

function PinTypesModal({ onClose }: { onClose: () => void }) {
  const shapes: Record<string, (color: string) => React.ReactNode> = {
    balloons: (c) => (
      <div className="flex flex-col items-center">
        <div className="flex gap-0.5 items-end">
          <div className="h-3.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
          <div className="h-3.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
        </div>
        <div className="w-px h-1.5 opacity-50" style={{ backgroundColor: c }} />
      </div>
    ),
    house: (c) => <div className="h-5 w-5 flex-shrink-0" style={{ backgroundColor: c, clipPath: "polygon(50% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)" }} />,
    vacation: (c) => (
      <div className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: c }}>
        <span className="text-[9px] leading-none text-white">☀</span>
      </div>
    ),
    memorable_event: (c) => <span className="text-lg leading-none flex-shrink-0" style={{ color: c }}>♥</span>,
    pin: (c) => (
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
        <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `7px solid ${c}` }} />
      </div>
    ),
    circle: (c) => <div className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />,
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border)]">
          <h2 className="font-display text-lg font-bold text-[var(--foreground)]">What do the pins mean?</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {/* List */}
        <div className="divide-y divide-[var(--border)]">
          {PIN_DESCRIPTIONS.map((pin) => (
            <div key={pin.label} className="flex items-center gap-3 px-5 py-3">
              <div className="w-7 flex items-center justify-center flex-shrink-0">
                {shapes[pin.symbol]?.(pin.color)}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-[var(--foreground)]">{pin.label}</span>
                <span className="text-sm text-[var(--muted)]"> — {pin.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


export default function MapPage() {
  const { activeFamilyId: _activeFamilyId } = useFamily();
  const [filter, setFilter] = useState<MapFilter>(DEFAULT_FILTER);
  const [showPinModal, setShowPinModal] = useState(false);

  function toggleFilter(key: keyof MapFilter) {
    setFilter((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div>
      {showPinModal && <PinTypesModal onClose={() => setShowPinModal(false)} />}
      <MapFirstVisitBanner />
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
              Family Map
            </h1>
            <p className="mt-2 text-[var(--muted)]">
              Where you&apos;ve lived, where you&apos;ve been, and where that one road trip went sideways.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AddLocationForm />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          {LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.symbol === "balloons" ? (
                <div className="flex flex-col items-center">
                  <div className="flex gap-0.5 items-end">
                    <div className="h-3 w-2 rounded-full border border-white/30" style={{ backgroundColor: item.color }} />
                    <div className="h-3 w-2 rounded-full border border-white/30" style={{ backgroundColor: item.color }} />
                  </div>
                  <div className="w-px h-1 mt-0.5 opacity-60" style={{ backgroundColor: item.color }} />
                </div>
              ) : item.symbol === "house" ? (
                <div className="h-4 w-4" style={{ backgroundColor: item.color, clipPath: "polygon(50% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)" }} />
              ) : item.symbol === "vacation" ? (
                <div className="flex h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: item.color }}>
                  <span className="text-[8px] leading-none text-white">☀</span>
                </div>
              ) : item.symbol === "memorable_event" ? (
                <span className="text-sm leading-none" style={{ color: item.color }} aria-hidden>♥</span>
              ) : item.symbol === "pin" ? (
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <div className="mt-0.5" style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `6px solid ${item.color}` }} />
                </div>
              ) : item.symbol === "circle" ? (
                <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: item.color }} />
              ) : null}
              <span className="text-sm text-[var(--muted)]">{item.label}</span>
            </div>
          ))}
          <button
            onClick={() => setShowPinModal(true)}
            className="flex items-center justify-center h-5 w-5 rounded-full border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-xs font-semibold leading-none"
            title="What do the pins mean?"
          >
            ?
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-[var(--muted)]">Show on map:</span>
          {(
            [
              { key: "birth" as const, label: "Our roots" },
              { key: "homes" as const, label: "Home base" },
              { key: "vacation" as const, label: "The trip" },
              { key: "memorableEvent" as const, label: "The moment" },
              { key: "visits" as const, label: "The tradition" },
              { key: "other" as const, label: "Other" },
            ] as const
          ).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filter[key] !== false}
                onChange={() => toggleFilter(key)}
                className="rounded border-[var(--border)] text-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <MapComponent filter={filter} />
      </div>
    </div>
  );
}
