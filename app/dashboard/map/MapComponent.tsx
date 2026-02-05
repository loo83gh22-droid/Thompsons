"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@/src/lib/supabase/client";
import { CountryLayer } from "./CountryLayer";

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
  family_members:
    | { name: string; color: string; symbol: string }
    | { name: string; color: string; symbol: string }[]
    | null;
};

const CLUSTER_RADIUS = 0.04; // degrees - spread for overlapping pins
const LOCATION_TOLERANCE = 0.02; // degrees - consider "same" location

function createPinIcon(
  color: string,
  symbol: string,
  dateLabel: string,
  isFamily: boolean
) {
  const size = isFamily ? 20 : 14;
  const border = "2px solid white";
  const shadow = "0 1px 3px rgba(0,0,0,0.4)";

  const shapeDivs: Record<string, string> = {
    circle: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:${shadow};"></div>`,
    square: `<div style="width:${size}px;height:${size}px;background:${color};border:${border};box-shadow:${shadow};"></div>`,
    triangle: `<div style="width:0;height:0;border-left:${size/2}px solid transparent;border-right:${size/2}px solid transparent;border-bottom:${size}px solid ${color};filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));"></div>`,
    diamond: `<div style="width:${size}px;height:${size}px;background:${color};border:${border};box-shadow:${shadow};transform:rotate(45deg);"></div>`,
    star: `<div style="width:${size}px;height:${size}px;background:${color};border:${border};box-shadow:${shadow};clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);"></div>`,
    balloons: `<div style="display:flex;flex-direction:column;align-items:center;"><div style="display:flex;gap:2px;align-items:flex-end;"><div style="width:${size*0.6}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:${shadow};"></div><div style="width:${size*0.6}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:${shadow};"></div></div><div style="width:1px;height:${size*0.3}px;background:${color};opacity:0.6;margin-top:-2px;"></div></div>`,
    pin: `<div style="display:flex;flex-direction:column;align-items:center;"><div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:${shadow};"></div><div style="width:0;height:0;border-left:${size/2}px solid transparent;border-right:${size/2}px solid transparent;border-top:${size*0.6}px solid ${color};margin-top:-2px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));"></div></div>`,
  };

  const shapeHtml = shapeDivs[symbol] || shapeDivs.circle;

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        ${shapeHtml}
        ${dateLabel ? `<span style="font-size:9px;color:white;text-shadow:0 0 2px black,0 1px 2px black;white-space:nowrap;margin-top:2px;">${dateLabel}</span>` : ""}
      </div>
    `,
    iconSize: [size + 40, size + 24],
    iconAnchor: [(size + 40) / 2, size + 22],
  });
}

function offsetPosition(
  lat: number,
  lng: number,
  index: number,
  total: number
): [number, number] {
  if (total <= 1) return [lat, lng];
  const angle = (360 / total) * index * (Math.PI / 180);
  const latOffset = CLUSTER_RADIUS * Math.cos(angle);
  const lngOffset =
    (CLUSTER_RADIUS * Math.sin(angle)) / Math.cos((lat * Math.PI) / 180);
  return [lat + latOffset, lng + lngOffset];
}

function groupLocations(locations: TravelLocation[]) {
  const groups: TravelLocation[][] = [];
  const used = new Set<string>();

  for (const loc of locations) {
    if (used.has(loc.id)) continue;

    const group = [loc];
    used.add(loc.id);

    for (const other of locations) {
      if (used.has(other.id)) continue;
      const dLat = Math.abs(loc.lat - other.lat);
      const dLng = Math.abs(loc.lng - other.lng);
      if (dLat < LOCATION_TOLERANCE && dLng < LOCATION_TOLERANCE) {
        group.push(other);
        used.add(other.id);
      }
    }
    groups.push(group);
  }
  return groups;
}

export default function MapComponent() {
  const [locations, setLocations] = useState<TravelLocation[]>([]);
  const [loading, setLoading] = useState(true);

  function fetchLocations(showLoading = true) {
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
        family_members (name, color, symbol)
      `)
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
  }, []);

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

  const positionedPins = useMemo(() => {
    const groups = groupLocations(locations);
    const result: { loc: TravelLocation; pos: [number, number]; index: number; total: number }[] = [];
    for (const group of groups) {
      const baseLat = group[0].lat;
      const baseLng = group[0].lng;
      group.forEach((loc, i) => {
        const [lat, lng] = offsetPosition(baseLat, baseLng, i, group.length);
        result.push({ loc, pos: [lat, lng], index: i, total: group.length });
      });
    }
    return result;
  }, [locations]);

  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-xl bg-[var(--surface)]">
        <span className="text-[var(--muted)]">Loading map...</span>
      </div>
    );
  }

  return (
    <MapContainer
      center={[56, -100]}
      zoom={4}
      minZoom={1}
      maxZoom={18}
      className="h-[500px] w-full rounded-xl"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <CountryLayer visitedCodes={visitedCountryCodes} />
      {positionedPins.map(({ loc, pos, index, total }) => {
        const member = Array.isArray(loc.family_members)
          ? loc.family_members[0]
          : loc.family_members;
        const color = member?.color || "#3b82f6";
        const isFamily = member?.name === "Family";
        const isBirthPlace = loc.is_birth_place === true;
        const symbol = isBirthPlace ? "balloons" : isFamily ? "star" : "pin";
        const dateLabel =
          loc.trip_date
            ? (() => {
                const [yr, mo, day] = loc.trip_date.split("-").map(Number);
                return new Date(yr, mo - 1, day).getFullYear().toString();
              })()
            : loc.year_visited
              ? loc.year_visited.toString()
              : "";

        return (
          <Marker
            key={`${loc.id}-${index}`}
            position={pos}
            icon={createPinIcon(color, symbol, dateLabel, isFamily)}
          >
            <Popup>
              <strong>{loc.location_name}</strong>
              <br />
              {member?.name || "Family"}
              {(loc.year_visited || loc.trip_date) &&
                ` · ${
                  dateLabel ||
                  (loc.trip_date
                    ? (() => {
                        const [yr, mo, day] = loc.trip_date.split("-").map(Number);
                        return new Date(yr, mo - 1, day).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                      })()
                    : "")
                }`}
              {loc.notes && (
                <>
                  <br />
                  <span className="text-sm text-gray-500">{loc.notes}</span>
                </>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
