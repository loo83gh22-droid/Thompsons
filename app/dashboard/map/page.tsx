"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AddLocationForm } from "./AddLocationForm";
import { MapFirstVisitBanner } from "./MapFirstVisitBanner";
import { rebuildLocationClusters, syncBirthPlacesToMap } from "./actions";
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
  { color: "#22c55e", label: "Huck", symbols: ["balloons", "house", "pin", "vacation", "memorable_event"] },
  { color: "#ef4444", label: "Maui", symbols: ["balloons", "house", "pin", "vacation", "memorable_event"] },
  { color: "#f97316", label: "Dad", symbols: ["balloons", "house", "pin", "vacation", "memorable_event"] },
  { color: "#d4a853", label: "Mom", symbols: ["balloons", "house", "pin", "vacation", "memorable_event"] },
  { color: "#3b82f6", label: "Family", symbols: ["star", "vacation", "memorable_event"] },
];

export default function MapPage() {
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildMessage, setRebuildMessage] = useState<string | null>(null);
  const [syncingBirth, setSyncingBirth] = useState(false);
  const [syncBirthMessage, setSyncBirthMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<MapFilter>(DEFAULT_FILTER);

  function toggleFilter(key: keyof MapFilter) {
    setFilter((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleRebuildClusters() {
    setRebuilding(true);
    setRebuildMessage(null);
    try {
      const { updated, error } = await rebuildLocationClusters();
      if (error) setRebuildMessage(`Error: ${error}`);
      else setRebuildMessage(updated > 0 ? `Re-clustered ${updated} pin(s). Map refreshed.` : "No pins to cluster.");
      window.dispatchEvent(new Event("map-refresh"));
    } finally {
      setRebuilding(false);
    }
  }

  async function handleSyncBirthPlaces() {
    setSyncingBirth(true);
    setSyncBirthMessage(null);
    try {
      const { added, error } = await syncBirthPlacesToMap();
      if (error) setSyncBirthMessage(`Error: ${error}`);
      else setSyncBirthMessage(added > 0 ? `Added ${added} birth place(s) to the map.` : "All birth places already on map.");
      window.dispatchEvent(new Event("map-refresh"));
    } finally {
      setSyncingBirth(false);
    }
  }

  return (
    <div>
      <MapFirstVisitBanner />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Family Map
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Birth places, homes, vacations, and memorable events. Add locations in journal entries or below. Use &quot;Sync birth places to map&quot; if member birth places don&apos;t appear.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddLocationForm />
          <button
            type="button"
            onClick={handleSyncBirthPlaces}
            disabled={syncingBirth}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
          >
            {syncingBirth ? "Syncing…" : "Sync birth places to map"}
          </button>
          <button
            type="button"
            onClick={handleRebuildClusters}
            disabled={rebuilding}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
          >
            {rebuilding ? "Rebuilding…" : "Rebuild clusters"}
          </button>
          {(rebuildMessage || syncBirthMessage) && (
            <span className="text-sm text-[var(--muted)]">{syncBirthMessage ?? rebuildMessage}</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {item.symbols?.map((sym) =>
                sym === "balloons" ? (
                  <div key={sym} className="flex flex-col items-center">
                    <div className="flex gap-0.5 items-end">
                      <div
                        className="h-3 w-2 rounded-full border border-white/30"
                        style={{ backgroundColor: item.color }}
                      />
                      <div
                        className="h-3 w-2 rounded-full border border-white/30"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                    <div
                      className="w-px h-1 mt-0.5 opacity-60"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                ) : sym === "pin" ? (
                  <div key={sym} className="flex flex-col items-center">
                    <div
                      className="h-2 w-2 rounded-full border border-white/30"
                      style={{ backgroundColor: item.color }}
                    />
                    <div
                      className="mt-0.5"
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: "4px solid transparent",
                        borderRight: "4px solid transparent",
                        borderTop: `6px solid ${item.color}`,
                      }}
                    />
                  </div>
                ) : sym === "star" ? (
                  <div
                    key={sym}
                    className="h-4 w-4 border border-white/30"
                    style={{
                      backgroundColor: item.color,
                      clipPath:
                        "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                    }}
                  />
                ) : sym === "house" ? (
                  <div
                    key={sym}
                    className="h-4 w-4 border border-white/30"
                    style={{
                      backgroundColor: item.color,
                      clipPath: "polygon(50% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)",
                    }}
                  />
                ) : sym === "vacation" ? (
                  <div
                    key={sym}
                    className="flex h-4 w-4 items-center justify-center rounded-full border border-white/30"
                    style={{ backgroundColor: item.color }}
                  >
                    <span className="text-[8px] leading-none">☀</span>
                  </div>
                ) : sym === "memorable_event" ? (
                  <span key={sym} className="text-sm leading-none" style={{ color: item.color }} aria-hidden>♥</span>
                ) : null
              )}
            </div>
            <span className="text-sm text-[var(--muted)]">{item.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Balloons = birth place · House = homes (lived) · Pin = visit · Star = family trip · Sun = vacation · Heart = memorable event · Circle = other
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-[var(--muted)]">Show on map:</span>
        {(
          [
            { key: "birth" as const, label: "Birth places" },
            { key: "homes" as const, label: "Homes" },
            { key: "vacation" as const, label: "Vacations" },
            { key: "memorableEvent" as const, label: "Memorable events" },
            { key: "other" as const, label: "Other" },
            { key: "visits" as const, label: "Visits / trips" },
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

      <div className="mt-6">
        <MapComponent filter={filter} />
      </div>
    </div>
  );
}
