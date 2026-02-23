/**
 * WorldMapSVG — async server component
 *
 * Fetches Natural Earth 110m TopoJSON from jsDelivr (same source used by the
 * dashboard's interactive MapComponent), converts each country polygon to SVG
 * path data using a simple equirectangular projection, and renders a clean
 * world map with optional pins.
 *
 * Cached for 24 h so it never causes a runtime penalty after the first render.
 */

import * as topojsonClient from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Polygon, MultiPolygon } from "geojson";

export type WorldPin = {
  lat: number;
  lng: number;
  color?: string;
  /** Pin circle radius in SVG units (viewBox 0 0 360 180). Default 5. */
  r?: number;
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getCountryPathData(): Promise<string> {
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return "";

    const topology = (await res.json()) as Topology;
    const countries = topology.objects
      .countries as GeometryCollection<Record<string, unknown>>;
    const { features } = topojsonClient.feature(
      topology,
      countries
    ) as FeatureCollection;

    const segs: string[] = [];

    for (const { geometry } of features) {
      if (!geometry) continue;

      // Normalise Polygon / MultiPolygon to number[][][][]
      const polys: number[][][][] =
        geometry.type === "Polygon"
          ? [(geometry as Polygon).coordinates]
          : geometry.type === "MultiPolygon"
          ? (geometry as MultiPolygon).coordinates
          : [];

      for (const poly of polys) {
        const ring = poly[0]; // outer ring only
        if (!ring || ring.length < 3) continue;

        // Equirectangular: x = lon + 180, y = 90 − lat  (fits viewBox 360×180)
        const d = ring
          .map((pt, j) => {
            const x = (pt[0] + 180).toFixed(1);
            const y = (90 - pt[1]).toFixed(1);
            return `${j === 0 ? "M" : "L"}${x},${y}`;
          })
          .join("") + "Z";

        segs.push(d);
      }
    }

    return segs.join("");
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  pins?: WorldPin[];
  /** Default pin radius when pin.r is not set. */
  defaultPinR?: number;
  /** Optional text badge rendered bottom-right inside the map. */
  badge?: string;
};

export async function WorldMapSVG({ pins = [], defaultPinR = 5, badge }: Props) {
  const d = await getCountryPathData();

  return (
    <div className="relative h-full w-full overflow-hidden">
      <svg
        viewBox="0 0 360 180"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* Ocean */}
        <rect width="360" height="180" fill="#c8dff0" />

        {/* Graticule — subtle latitude / longitude grid */}
        <line x1="0" y1="60"  x2="360" y2="60"  stroke="#9ec5db" strokeWidth="0.35" strokeDasharray="4,6" />
        <line x1="0" y1="90"  x2="360" y2="90"  stroke="#9ec5db" strokeWidth="0.55" />
        <line x1="0" y1="120" x2="360" y2="120" stroke="#9ec5db" strokeWidth="0.35" strokeDasharray="4,6" />
        <line x1="90"  y1="0" x2="90"  y2="180" stroke="#9ec5db" strokeWidth="0.35" strokeDasharray="4,6" />
        <line x1="180" y1="0" x2="180" y2="180" stroke="#9ec5db" strokeWidth="0.55" />
        <line x1="270" y1="0" x2="270" y2="180" stroke="#9ec5db" strokeWidth="0.35" strokeDasharray="4,6" />

        {/* Country fills — real Natural Earth 110m outlines */}
        {d && (
          <path
            d={d}
            fill="#b8ceb2"
            stroke="#9db895"
            strokeWidth="0.35"
            fillRule="evenodd"
          />
        )}

        {/* Pins */}
        {pins.map((pin, i) => {
          const cx = pin.lng + 180;
          const cy = 90 - pin.lat;
          const r = pin.r ?? defaultPinR;
          const color = pin.color ?? "#d97706";
          return (
            <g key={i}>
              {/* Glow halo */}
              <circle cx={cx} cy={cy} r={r * 2.2} fill={color} opacity="0.18" />
              {/* Main fill */}
              <circle cx={cx} cy={cy} r={r} fill={color} />
              {/* White centre dot */}
              <circle cx={cx} cy={cy} r={r * 0.42} fill="white" />
            </g>
          );
        })}
      </svg>

      {badge && (
        <div
          className="absolute bottom-2 right-2 rounded-lg px-1.5 py-0.5 text-[8px] font-medium"
          style={{
            backgroundColor: "rgba(255,255,255,0.9)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        >
          {badge}
        </div>
      )}
    </div>
  );
}
