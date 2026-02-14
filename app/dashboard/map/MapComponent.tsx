"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { UI_DISPLAY, LOCATION_CONSTANTS } from "@/src/lib/constants";
import { GoogleMapsCountryLayer } from "./GoogleMapsCountryLayer";

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

const mapContainerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "0.75rem",
};

export type MapFilter = {
  birth?: boolean;
  homes?: boolean;
  vacation?: boolean;
  memorableEvent?: boolean;
  other?: boolean;
  visits?: boolean;
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

/** Group locations by cluster_id, or by proximity for legacy pins without cluster */
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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="40" viewBox="0 0 24 40">
    <g transform="translate(0,0)">
      ${shapeSvg}
      ${labelSvg}
      ${countBadge}
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** Renders the "add API key" message without calling any Google Maps hooks. */
function MapNoApiKeyMessage() {
  return (
    <div className="flex h-[500px] items-center justify-center rounded-xl bg-[var(--surface)]">
      <p className="max-w-md text-center text-[var(--muted)]">
        Add <code className="rounded bg-[var(--surface-hover)] px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your{" "}
        <code className="rounded bg-[var(--surface-hover)] px-1">.env.local</code> to enable the map.
      </p>
    </div>
  );
}

/** Inner component that uses useJsApiLoader — only mounted when we have a valid API key. */
function MapComponentWithLoader({ apiKey, filter }: { apiKey: string; filter?: MapFilter }) {
  const router = useRouter();
  const { activeFamilyId } = useFamily();
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  const [locations, setLocations] = useState<TravelLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<{
    locs: TravelLocation[];
    pos: [number, number];
  } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  function fetchLocations(showLoading = true) {
    if (!activeFamilyId) return;
    if (showLoading) setLoading(true);
    try {
      const supabase = createClient();
      supabase
        .from("travel_locations")
        .select(`
          id,
          lat,
          lng,
          location_name,
          year_visited,
          trip_date,
          notes,
          country_code,
          is_birth_place,
          is_place_lived,
          trip_date_end,
          location_type,
          location_label,
          journal_entry_id,
          location_cluster_id,
          family_members (name, color, symbol)
        `)
        .eq("family_id", activeFamilyId)
        .order("created_at", { ascending: true })
        .then(({ data, error }) => {
          if (!error && data) {
            const rows = data as unknown as TravelLocation[];
            const byId = new Map<string, TravelLocation>();
            rows.forEach((r) => byId.set(r.id, r));
            const list = Array.from(byId.values());
            setLocations(list);
            if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
              const withCluster = list.filter((l) => l.location_cluster_id);
              const groups = groupLocations(list);
              console.log("🗺️ Map: travel_locations fetched", {
                total: list.length,
                withClusterId: withCluster.length,
                withoutClusterId: list.length - withCluster.length,
                groupCount: groups.length,
                perGroup: groups.map((g) => ({ locs: g.length, clusterId: g[0]?.location_cluster_id ?? "null", name: g[0]?.location_name })),
              });
            }
          }
          setLoading(false);
        });
    } catch {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLocations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchLocations intentionally omitted to avoid re-fetch loops
  }, [activeFamilyId]);

  useEffect(() => {
    function onRefresh() {
      fetchLocations(false);
    }
    window.addEventListener("map-refresh", onRefresh);
    return () => window.removeEventListener("map-refresh", onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchLocations intentionally not in deps
  }, []);

  const filteredLocations = useMemo(
    () => applyFilter(locations, filter),
    [locations, filter]
  );

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

  if (loadError) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-xl bg-[var(--surface)]">
        <p className="text-red-400">Error loading Google Maps. Check your API key.</p>
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-xl bg-[var(--surface)]">
        <span className="text-[var(--muted)]">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={UI_DISPLAY.mapDefaultCenter}
        zoom={4}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          minZoom: 1,
          maxZoom: 20,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT,
          },
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        <GoogleMapsCountryLayer map={map} visitedCodes={visitedCountryCodes} />
        {clusterPins.map(({ locs, pos }) => {
          const loc = locs[0];
          const member = Array.isArray(loc.family_members)
            ? loc.family_members[0]
            : loc.family_members;
          const color = member?.color || "#3b82f6";
          const isFamily = member?.name === "Family";
          const isBirthPlace = loc.is_birth_place === true;
          const isPlaceLived = loc.is_place_lived === true;
          const locationType = loc.location_type ?? null;
          const symbol =
            isBirthPlace
              ? "balloons"
              : isPlaceLived
                ? "house"
                : locationType === "memorable_event"
                  ? "memorable_event"
                  : locationType === "vacation"
                    ? "vacation"
                    : locationType === "other"
                      ? "circle"
                      : isFamily
                        ? "star"
                        : "pin";
          const dateLabel =
            loc.trip_date
              ? new Date(loc.trip_date + "T12:00:00").getFullYear().toString()
              : loc.year_visited
                ? loc.year_visited.toString()
                : "";

          return (
            <Marker
              key={loc.location_cluster_id || loc.id}
              position={{ lat: pos[0], lng: pos[1] }}
              icon={{
                url: createPinSvgUrl(color, symbol, dateLabel, isFamily, locs.length),
                scaledSize: new google.maps.Size(48, 40),
                anchor: new google.maps.Point(24, 38),
              }}
              onClick={() => {
                if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
                  console.log("📍 Pin clicked:", { location: loc.location_name, entriesInCluster: locs.length, locs: locs.map((l) => ({ id: l.id, notes: l.notes, journal_entry_id: l.journal_entry_id })) });
                }
                setSelectedCluster({ locs, pos });
              }}
            />
          );
        })}
        {selectedCluster && (() => {
          const locs = [...selectedCluster.locs].sort((a, b) => {
            const da = a.trip_date ? new Date(a.trip_date + "T12:00:00").getTime() : 0;
            const db = b.trip_date ? new Date(b.trip_date + "T12:00:00").getTime() : 0;
            return db - da; // most recent first
          });
          const first = locs[0];
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
            <InfoWindow
              position={{ lat: selectedCluster.pos[0], lng: selectedCluster.pos[1] }}
              onCloseClick={() => setSelectedCluster(null)}
            >
              <div className="min-w-[220px] max-w-[320px] p-3 text-[var(--foreground)]">
                <div className="mb-3 border-b border-[var(--border)] pb-2">
                  <h3 className="font-bold text-lg text-[var(--foreground)]">
                    {locationName}
                  </h3>
                  {firstLabel && (
                    <p className="text-xs font-medium text-[var(--accent)] mt-1">{firstLabel}</p>
                  )}
                  {livedHere && !livedLabel && (
                    <p className="text-xs font-medium text-[var(--accent)] mt-1">Lived here</p>
                  )}
                  {livedLabel && (
                    <p className="text-xs font-medium text-[var(--accent)] mt-1">{livedLabel}</p>
                  )}
                  {locs.some((l) => l.location_type === "vacation") && !livedHere && (
                    <p className="text-xs font-medium text-[var(--muted)] mt-1">Vacation</p>
                  )}
                  {locs.some((l) => l.location_type === "memorable_event") && !livedHere && (
                    <p className="text-xs font-medium text-[var(--muted)] mt-1">Memorable event</p>
                  )}
                  {locs.some((l) => l.location_type === "other") && !livedHere && !firstLabel && (
                    <p className="text-xs font-medium text-[var(--muted)] mt-1">Other</p>
                  )}
                  {dateLabel && !livedLabel && (
                    <p className="text-sm text-[var(--muted)] mt-1">{dateLabel}</p>
                  )}
                  {locs.length > 1 && (
                    <div className="mt-2 inline-block rounded bg-[var(--accent)]/20 px-2 py-1 text-xs font-semibold text-[var(--accent)]">
                      {locs.length} memories here
                    </div>
                  )}
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {locs.map((l) => {
                    const member = Array.isArray(l.family_members) ? l.family_members[0] : l.family_members;
                    const title = l.notes || "Journal entry";
                    const dateStr = l.trip_date
                      ? format(new Date(l.trip_date + "T12:00:00"), "MMMM d, yyyy")
                      : l.year_visited
                        ? String(l.year_visited)
                        : "";
                    return (
                      <div
                        key={l.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedCluster(null);
                          if (l.journal_entry_id) {
                            router.push(`/dashboard/journal/${l.journal_entry_id}/edit`);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedCluster(null);
                            if (l.journal_entry_id) {
                              router.push(`/dashboard/journal/${l.journal_entry_id}/edit`);
                            }
                          }
                        }}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 hover:bg-[var(--surface-hover)] hover:border-[var(--accent)]/50 cursor-pointer transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors truncate">
                              {title}
                            </h4>
                            {dateStr && (
                              <p className="text-xs text-[var(--muted)] mt-1">{dateStr}</p>
                            )}
                            {member?.name && member.name !== "Family" && (
                              <p className="text-xs text-[var(--muted)] mt-0.5">{member.name}</p>
                            )}
                          </div>
                          <span className="text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors shrink-0">→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </InfoWindow>
          );
        })()}
      </GoogleMap>
    </div>
  );
}

export default function MapComponent({ filter }: { filter?: MapFilter } = {}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return <MapNoApiKeyMessage />;
  }
  return <MapComponentWithLoader apiKey={apiKey} filter={filter} />;
}
