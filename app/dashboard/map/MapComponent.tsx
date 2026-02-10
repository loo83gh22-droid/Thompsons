"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { GoogleMapsCountryLayer } from "./GoogleMapsCountryLayer";

type TravelLocation = {
  id: string;
  lat: number;
  lng: number;
  location_name: string;
  year_visited: number | null;
  trip_date: string | null;
  notes: string | null;
  country_code?: string;
  is_birth_place?: boolean;
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

const defaultCenter = { lat: 56, lng: -100 };

/** Group locations by cluster_id, or by proximity for legacy pins without cluster */
function groupLocations(locations: TravelLocation[]) {
  const LOCATION_TOLERANCE = 0.02;
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
          if (dLat < LOCATION_TOLERANCE && dLng < LOCATION_TOLERANCE) {
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

export default function MapComponent() {
  const { activeFamilyId } = useFamily();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
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
          setLocations(Array.from(byId.values()));
        }
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchLocations(true);
  }, [activeFamilyId]);

  useEffect(() => {
    function onRefresh() {
      fetchLocations(false);
    }
    window.addEventListener("map-refresh", onRefresh);
    return () => window.removeEventListener("map-refresh", onRefresh);
  }, []);

  const visitedCountryCodes = useMemo(() => {
    const codes = new Set<string>();
    locations.forEach((loc) => {
      if (loc.country_code) codes.add(loc.country_code);
    });
    return codes;
  }, [locations]);

  const clusterPins = useMemo(() => {
    const groups = groupLocations(locations);
    return groups.map((group) => {
      const first = group[0];
      return { locs: group, pos: [first.lat, first.lng] as [number, number] };
    });
  }, [locations]);

  if (!apiKey) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-xl bg-[var(--surface)]">
        <p className="max-w-md text-center text-[var(--muted)]">
          Add <code className="rounded bg-[var(--surface-hover)] px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your{" "}
          <code className="rounded bg-[var(--surface-hover)] px-1">.env.local</code> to enable the map.
        </p>
      </div>
    );
  }

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
        center={defaultCenter}
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
          const symbol = isBirthPlace ? "balloons" : isFamily ? "star" : "pin";
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
              onClick={() => setSelectedCluster({ locs, pos })}
            />
          );
        })}
        {selectedCluster && (
          <InfoWindow
            position={{ lat: selectedCluster.pos[0], lng: selectedCluster.pos[1] }}
            onCloseClick={() => setSelectedCluster(null)}
          >
            <div className="min-w-[200px] max-w-[280px] p-1 text-[var(--foreground)]">
              <strong>{selectedCluster.locs[0].location_name}</strong>
              {selectedCluster.locs.length > 1 && (
                <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-medium text-red-400">
                  {selectedCluster.locs.length} entries
                </span>
              )}
              <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto">
                {selectedCluster.locs.map((l) => (
                  <div key={l.id} className="border-b border-[var(--border)] pb-2 last:border-0 last:pb-0">
                    {(() => {
                      const m = Array.isArray(l.family_members) ? l.family_members[0] : l.family_members;
                      return <span className="text-sm">{m?.name || "Family"}</span>;
                    })()}
                    {l.year_visited || l.trip_date ? (
                      <span className="text-sm text-[var(--muted)]">
                        {" · "}
                        {l.trip_date
                          ? new Date(l.trip_date + "T12:00:00").toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : l.year_visited}
                      </span>
                    ) : null}
                    {l.notes && <div className="text-xs text-gray-500 mt-0.5">{l.notes}</div>}
                    {l.journal_entry_id && (
                      <a
                        href={`/dashboard/journal/${l.journal_entry_id}/edit`}
                        className="mt-1 inline-block text-xs font-medium text-[var(--accent)] hover:underline"
                      >
                        View entry →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
