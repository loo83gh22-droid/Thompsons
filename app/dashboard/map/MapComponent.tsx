"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { UI_DISPLAY, LOCATION_CONSTANTS } from "@/src/lib/constants";
import { COUNTRY_FLAG_STYLES } from "./countryFlagColors";
import * as topojsonClient from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Feature, GeoJsonProperties } from "geojson";

type TravelLocation = {
  id: string;
  lat: number;
  lng: number;
  location_name: string;
  year_visited: number | null;
  trip_date: string | null;
  trip_date_end?: string | null;
  notes: string | null;
  country_code?: string;
  is_birth_place?: boolean;
  is_place_lived?: boolean;
  location_type?: "vacation" | "memorable_event" | "other" | null;
  location_label?: string | null;
  journal_entry_id?: string | null;
  location_cluster_id?: string | null;
  family_members:
    | { name: string; color: string; symbol: string }
    | { name: string; color: string; symbol: string }[]
    | null;
};

export type MapFilter = {
  birth?: boolean;
  homes?: boolean;
  vacation?: boolean;
  memorableEvent?: boolean;
  other?: boolean;
  visits?: boolean;
};

const NUMERIC_TO_ALPHA2: Record<string, string> = {
  "124": "CA", "484": "MX", "840": "US", "826": "GB", "250": "FR",
  "724": "ES", "380": "IT", "392": "JP", "036": "AU", "276": "DE",
  "076": "BR", "156": "CN", "356": "IN",
};

/** Color palette keyed by pin type — consistent across all users */
const PIN_TYPE_COLORS: Record<string, string> = {
  balloons: "#ec4899",       // pink — birth places
  house: "#22c55e",          // green — homes
  vacation: "#f97316",       // orange — vacations
  memorable_event: "#ef4444",// red — memorable events
  pin: "#3b82f6",            // blue — visits / trips
  star: "#3b82f6",           // blue — family trips
  circle: "#6b7280",         // gray — other
};

function applyFilter(locations: TravelLocation[], filter: MapFilter | undefined): TravelLocation[] {
  if (!filter) return locations;
  return locations.filter((loc) => {
    if (loc.is_birth_place === true) return filter.birth !== false;
    if (loc.is_place_lived === true) return filter.homes !== false;
    if (loc.location_type === "vacation") return filter.vacation !== false;
    if (loc.location_type === "memorable_event") return filter.memorableEvent !== false;
    if (loc.location_type === "other") return filter.other !== false;
    return filter.visits !== false;
  });
}

function groupLocations(locations: TravelLocation[]) {
  const byCluster = new Map<string | null, TravelLocation[]>();
  for (const loc of locations) {
    const key = loc.location_cluster_id ?? null;
    if (!byCluster.has(key)) byCluster.set(key, []);
    byCluster.get(key)!.push(loc);
  }
  const result: TravelLocation[][] = [];
  for (const [clusterId, group] of byCluster) {
    if (clusterId) {
      result.push(group);
    } else {
      const used = new Set<string>();
      for (const loc of group) {
        if (used.has(loc.id)) continue;
        const sub = [loc];
        used.add(loc.id);
        for (const other of group) {
          if (used.has(other.id)) continue;
          const dLat = Math.abs(loc.lat - other.lat);
          const dLng = Math.abs(loc.lng - other.lng);
          if (dLat < LOCATION_CONSTANTS.proximityToleranceDegrees && dLng < LOCATION_CONSTANTS.proximityToleranceDegrees) {
            sub.push(other);
            used.add(other.id);
          }
        }
        result.push(sub);
      }
    }
  }
  return result;
}

function createPinSvgUrl(
  color: string,
  symbol: string,
  dateLabel: string,
  isFamily: boolean,
  clusterCount?: number
): string {
  const size = isFamily ? 20 : 14;
  const shapes: Record<string, string> = {
    circle: `<circle cx="12" cy="12" r="${size / 2}" fill="${color}" stroke="white" stroke-width="2"/>`,
    square: `<rect x="${12 - size / 2}" y="${12 - size / 2}" width="${size}" height="${size}" fill="${color}" stroke="white" stroke-width="2"/>`,
    triangle: `<polygon points="12,${12 - size / 2} ${12 - size / 2},${12 + size / 2} ${12 + size / 2},${12 + size / 2}" fill="${color}" stroke="white" stroke-width="2"/>`,
    diamond: `<polygon points="12,${12 - size / 2} ${12 + size / 2},12 12,${12 + size / 2} ${12 - size / 2},12" fill="${color}" stroke="white" stroke-width="2"/>`,
    star: `<polygon points="12,2 14,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9" fill="${color}" stroke="white" stroke-width="2"/>`,
    pin: `<circle cx="12" cy="10" r="6" fill="${color}" stroke="white" stroke-width="2"/><polygon points="12,16 8,24 16,24" fill="${color}" stroke="white" stroke-width="1"/>`,
    balloons: `<circle cx="9" cy="10" r="5" fill="${color}" stroke="white" stroke-width="2"/><circle cx="15" cy="10" r="5" fill="${color}" stroke="white" stroke-width="2"/><line x1="12" y1="15" x2="12" y2="22" stroke="${color}" stroke-width="1" opacity="0.6"/>`,
    house: `<path d="M12 4L4 12v10h6v-6h4v6h6V12L12 4z" fill="${color}" stroke="white" stroke-width="2" stroke-linejoin="round"/>`,
    vacation: `<circle cx="12" cy="12" r="5" fill="${color}" stroke="white" stroke-width="2"/><path d="M12 2v2M12 20v2M4 12h2M18 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M5.2 18.8l1.4-1.4M17.4 6.6l1.4-1.4" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`,
    memorable_event: `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="${color}" stroke="white" stroke-width="2" stroke-linejoin="round"/>`,
  };
  const shapeSvg = shapes[symbol] || shapes.circle;
  const labelSvg = dateLabel
    ? `<text x="12" y="28" font-size="9" fill="white" text-anchor="middle" style="text-shadow: 0 0 2px black;">${dateLabel}</text>`
    : "";
  const countBadge =
    clusterCount && clusterCount > 1
      ? `<circle cx="20" cy="4" r="8" fill="#ef4444"/><text x="20" y="6" font-size="10" font-weight="bold" fill="white" text-anchor="middle">${clusterCount}</text>`
      : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="40" viewBox="0 0 24 40">${shapeSvg}${labelSvg}${countBadge}</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** Leaflet country layer that highlights visited countries */
function CountryLayer({ visitedCodes }: { visitedCodes: Set<string> }) {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topology: Topology) => {
        const countries = topology.objects.countries as GeometryCollection<object>;
        const geo = topojsonClient.feature(topology, countries) as FeatureCollection;
        setGeojson(geo);
      })
      .catch(() => {});
  }, []);

  const styleFeature = useCallback(
    (feature?: Feature<import("geojson").Geometry, GeoJsonProperties>): L.PathOptions => {
      if (!feature) return { fillOpacity: 0, weight: 0 };
      const id = (feature.id ?? feature.properties?.id)?.toString();
      const code = id ? NUMERIC_TO_ALPHA2[id] : null;
      if (!code || !visitedCodes.has(code)) {
        return { fillOpacity: 0, weight: 0 };
      }
      const style = COUNTRY_FLAG_STYLES[code];
      return {
        fillColor: style?.fill ?? "#3b82f6",
        fillOpacity: style?.fillOpacity ?? 0.15,
        weight: 1,
        color: "rgba(255,255,255,0.2)",
      };
    },
    [visitedCodes]
  );

  if (!geojson || visitedCodes.size === 0) return null;
  return <GeoJSON key={Array.from(visitedCodes).sort().join(",")} data={geojson} style={styleFeature} />;
}

/** Auto-fit map bounds to markers */
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (positions.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      fitted.current = true;
    }
  }, [map, positions]);
  return null;
}

function ClusterPopupContent({
  locs,
  onNavigate,
}: {
  locs: TravelLocation[];
  onNavigate: (path: string) => void;
}) {
  const sorted = [...locs].sort((a, b) => {
    const da = a.trip_date ? new Date(a.trip_date + "T12:00:00").getTime() : 0;
    const db = b.trip_date ? new Date(b.trip_date + "T12:00:00").getTime() : 0;
    return db - da;
  });
  const first = sorted[0];
  const locationName = first?.location_name ?? "Location";

  const dateRangeStart = locs.reduce<string | null>((min, l) => {
    const d = l.trip_date ?? (l.year_visited ? `${l.year_visited}-01-01` : null);
    if (!d) return min;
    return !min || d < min ? d : min;
  }, null);
  const dateRangeEnd = locs.reduce<string | null>((max, l) => {
    const d = l.trip_date_end ?? l.trip_date ?? (l.year_visited ? `${l.year_visited}-12-31` : null);
    if (!d) return max;
    return !max || d > max ? d : max;
  }, null);
  const dateLabel =
    dateRangeStart && dateRangeEnd
      ? dateRangeStart === dateRangeEnd
        ? format(new Date(dateRangeStart + "T12:00:00"), "MMMM d, yyyy")
        : `${format(new Date(dateRangeStart + "T12:00:00"), "MMM d, yyyy")} – ${format(new Date(dateRangeEnd + "T12:00:00"), "MMM d, yyyy")}`
      : dateRangeStart
        ? format(new Date(dateRangeStart + "T12:00:00"), "MMMM d, yyyy")
        : null;

  const livedHere = locs.some((l) => l.is_place_lived);
  const livedLabel =
    livedHere && dateRangeStart
      ? dateRangeEnd && dateRangeEnd !== dateRangeStart
        ? `Lived ${format(new Date(dateRangeStart + "T12:00:00"), "MMM d, yyyy")} – ${format(new Date(dateRangeEnd + "T12:00:00"), "MMM d, yyyy")}`
        : `Lived from ${format(new Date(dateRangeStart + "T12:00:00"), "MMM d, yyyy")}`
      : null;

  const firstLabel = first?.location_label?.trim();

  return (
    <div style={{ minWidth: 220, maxWidth: 320 }}>
      <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 8, marginBottom: 8 }}>
        <h3 style={{ fontWeight: "bold", fontSize: 16, margin: 0 }}>{locationName}</h3>
        {firstLabel && <p style={{ fontSize: 12, fontWeight: 500, color: "#b8860b", margin: "4px 0 0" }}>{firstLabel}</p>}
        {livedHere && !livedLabel && <p style={{ fontSize: 12, fontWeight: 500, color: "#b8860b", margin: "4px 0 0" }}>Lived here</p>}
        {livedLabel && <p style={{ fontSize: 12, fontWeight: 500, color: "#b8860b", margin: "4px 0 0" }}>{livedLabel}</p>}
        {locs.some((l) => l.location_type === "vacation") && !livedHere && (
          <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>Vacation</p>
        )}
        {locs.some((l) => l.location_type === "memorable_event") && !livedHere && (
          <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>Memorable event</p>
        )}
        {dateLabel && !livedLabel && <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>{dateLabel}</p>}
        {locs.length > 1 && (
          <span style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 600, background: "rgba(184,134,11,0.15)", color: "#b8860b", padding: "2px 8px", borderRadius: 6 }}>
            {locs.length} memories here
          </span>
        )}
      </div>
      <div style={{ maxHeight: 260, overflowY: "auto" }}>
        {sorted.map((l) => {
          const member = Array.isArray(l.family_members) ? l.family_members[0] : l.family_members;
          const title = l.notes || "Journal entry";
          const dateStr = l.trip_date
            ? format(new Date(l.trip_date + "T12:00:00"), "MMMM d, yyyy")
            : l.year_visited ? String(l.year_visited) : "";
          return (
            <div
              key={l.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (l.journal_entry_id) onNavigate(`/dashboard/journal/${l.journal_entry_id}/edit`);
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && l.journal_entry_id) {
                  e.preventDefault();
                  onNavigate(`/dashboard/journal/${l.journal_entry_id}/edit`);
                }
              }}
              style={{
                borderRadius: 8, border: "1px solid #e5e7eb", background: "#fafaf8",
                padding: 10, marginBottom: 6, cursor: l.journal_entry_id ? "pointer" : "default",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{title}</h4>
                  {dateStr && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>{dateStr}</p>}
                  {member?.name && member.name !== "Family" && (
                    <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>{member.name}</p>
                  )}
                </div>
                {l.journal_entry_id && <span style={{ color: "#6b7280" }}>→</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MapComponent({ filter }: { filter?: MapFilter } = {}) {
  const router = useRouter();
  const { activeFamilyId } = useFamily();
  const [locations, setLocations] = useState<TravelLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = useCallback(
    (showLoading = true) => {
      if (!activeFamilyId) return;
      if (showLoading) setLoading(true);
      try {
        const supabase = createClient();
        supabase
          .from("travel_locations")
          .select(`
            id, lat, lng, location_name, year_visited, trip_date, notes,
            country_code, is_birth_place, is_place_lived, trip_date_end,
            location_type, location_label, journal_entry_id, location_cluster_id,
            family_members (name, color, symbol)
          `)
          .eq("family_id", activeFamilyId)
          .order("created_at", { ascending: true })
          .then(({ data, error }) => {
            if (!error && data) {
              const rows = data as unknown as TravelLocation[];
              const byId = new Map<string, TravelLocation>();
              rows.forEach((r) => byId.set(r.id, r));
              setLocations(Array.from(byId.values()));
            }
            setLoading(false);
          });
      } catch {
        setLoading(false);
      }
    },
    [activeFamilyId]
  );

  useEffect(() => {
    fetchLocations(true);
  }, [fetchLocations]);

  useEffect(() => {
    const onRefresh = () => fetchLocations(false);
    window.addEventListener("map-refresh", onRefresh);
    return () => window.removeEventListener("map-refresh", onRefresh);
  }, [fetchLocations]);

  const filteredLocations = useMemo(() => applyFilter(locations, filter), [locations, filter]);

  const visitedCountryCodes = useMemo(() => {
    const codes = new Set<string>();
    filteredLocations.forEach((loc) => {
      if (loc.country_code) codes.add(loc.country_code);
    });
    return codes;
  }, [filteredLocations]);

  const clusterPins = useMemo(() => {
    const groups = groupLocations(filteredLocations);
    return groups.map((group) => {
      const first = group[0];
      return { locs: group, pos: [first.lat, first.lng] as [number, number] };
    });
  }, [filteredLocations]);

  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-xl bg-[var(--surface)]">
        <span className="text-[var(--muted)]">Loading map...</span>
      </div>
    );
  }

  const center: [number, number] = [UI_DISPLAY.mapDefaultCenter.lat, UI_DISPLAY.mapDefaultCenter.lng];

  return (
    <div className="overflow-hidden rounded-xl" style={{ height: 500 }}>
      <MapContainer
        center={center}
        zoom={UI_DISPLAY.mapDefaultZoom}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CountryLayer visitedCodes={visitedCountryCodes} />
        {clusterPins.length > 0 && (
          <FitBounds positions={clusterPins.map((c) => c.pos)} />
        )}
        {clusterPins.map(({ locs, pos }) => {
          const loc = locs[0];
          const member = Array.isArray(loc.family_members)
            ? loc.family_members[0]
            : loc.family_members;
          const isFamily = member?.name === "Family";
          const isBirthPlace = loc.is_birth_place === true;
          const isPlaceLived = loc.is_place_lived === true;
          const locationType = loc.location_type ?? null;
          const symbol =
            isBirthPlace ? "balloons"
              : isPlaceLived ? "house"
                : locationType === "memorable_event" ? "memorable_event"
                  : locationType === "vacation" ? "vacation"
                    : locationType === "other" ? "circle"
                      : isFamily ? "star" : "pin";
          const color = PIN_TYPE_COLORS[symbol] || "#3b82f6";
          const dateLabel =
            loc.trip_date
              ? new Date(loc.trip_date + "T12:00:00").getFullYear().toString()
              : loc.year_visited ? loc.year_visited.toString() : "";

          const iconUrl = createPinSvgUrl(color, symbol, dateLabel, isFamily, locs.length);
          const icon = L.icon({
            iconUrl,
            iconSize: [48, 40],
            iconAnchor: [24, 38],
            popupAnchor: [0, -38],
          });

          return (
            <Marker
              key={loc.location_cluster_id || loc.id}
              position={[pos[0], pos[1]]}
              icon={icon}
            >
              <Popup maxWidth={340} minWidth={220}>
                <ClusterPopupContent
                  locs={locs}
                  onNavigate={(path) => router.push(path)}
                />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
