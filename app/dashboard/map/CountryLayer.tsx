"use client";

import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { COUNTRY_FLAG_STYLES } from "./countryFlagColors";

// World Atlas uses ISO 3166-1 numeric ids - map to alpha-2
const NUMERIC_TO_ALPHA2: Record<string, string> = {
  "124": "CA",
  "484": "MX",
  "840": "US",
  "826": "GB",
  "250": "FR",
  "724": "ES",
  "380": "IT",
  "392": "JP",
  "036": "AU",
  "276": "DE",
  "076": "BR",
  "156": "CN",
  "356": "IN",
};

type CountryFeature = GeoJSON.GeoJsonObject & {
  id?: string;
  properties?: { name?: string };
};

export function CountryLayer({ visitedCodes }: { visitedCodes: Set<string> }) {
  const [geojson, setGeojson] = useState<GeoJSON.GeoJsonObject | null>(null);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topology: Topology) => {
        const countries = topology.objects.countries as GeometryCollection<object>;
        const geo = topojson.feature(topology, countries) as GeoJSON.FeatureCollection;
        setGeojson(geo);
      })
      .catch(() => setGeojson(null));
  }, []);

  if (!geojson || visitedCodes.size === 0) return null;

  const styleFeature = (feature?: GeoJSON.Feature) => {
    if (!feature?.properties) return { fillOpacity: 0, weight: 0 };
    const id = (feature as CountryFeature).id?.toString();
    const code = id ? NUMERIC_TO_ALPHA2[id] : null;
    if (!code || !visitedCodes.has(code)) {
      return { fillOpacity: 0, weight: 0 };
    }
    const style = COUNTRY_FLAG_STYLES[code];
    if (!style) {
      return {
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
        color: "transparent",
        weight: 0,
      };
    }
    return {
      fillColor: style.fill,
      fillOpacity: style.fillOpacity,
      color: "rgba(255,255,255,0.2)",
      weight: 1,
    };
  };

  return (
    <GeoJSON
      key="countries"
      data={geojson}
      style={(feature) => styleFeature(feature as GeoJSON.Feature)}
    />
  );
}
