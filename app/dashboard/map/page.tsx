"use client";

import dynamic from "next/dynamic";
import { AddLocationForm } from "./AddLocationForm";

// Google Maps loads client-side only
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center rounded-xl bg-[var(--surface)]">
      <span className="text-[var(--muted)]">Loading map...</span>
    </div>
  ),
});

const LEGEND = [
  { color: "#22c55e", label: "Huck", symbols: ["balloons", "pin"] },
  { color: "#ef4444", label: "Maui", symbols: ["balloons", "pin"] },
  { color: "#f97316", label: "Dad", symbols: ["balloons", "pin"] },
  { color: "#d4a853", label: "Mom", symbols: ["balloons", "pin"] },
  { color: "#3b82f6", label: "Family", symbols: ["star"] },
];

export default function MapPage() {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Family Map
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Where we&apos;ve been. Add a location in a journal entry or use the button below. Birth places and trips.
          </p>
        </div>
        <AddLocationForm />
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
                ) : null
              )}
            </div>
            <span className="text-sm text-[var(--muted)]">{item.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Balloons = birth places · Pin = solo trips · Star = family trips
      </p>

      <div className="mt-6">
        <MapComponent />
      </div>
    </div>
  );
}
