"use client";

import { useEffect, useState, useRef } from "react";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection } from "geojson";
import { COUNTRY_FLAG_STYLES } from "./countryFlagColors";

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

export function GoogleMapsCountryLayer({
  map,
  visitedCodes,
}: {
  map: google.maps.Map | null;
  visitedCodes: Set<string>;
}) {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);
  const dataLayerRef = useRef<google.maps.Data | null>(null);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topology: Topology) => {
        const countries = topology.objects.countries as GeometryCollection<object>;
        const geo = topojson.feature(topology, countries) as FeatureCollection;
        setGeojson(geo);
      })
      .catch(() => setGeojson(null));
  }, []);

  useEffect(() => {
    if (!map || !geojson || visitedCodes.size === 0) return;

    const dataLayer = new google.maps.Data();
    dataLayer.addGeoJson(geojson);

    dataLayer.setStyle((feature) => {
      const id = (feature.getId?.() ?? feature.getProperty("id"))?.toString();
      const code = id ? NUMERIC_TO_ALPHA2[id] : null;
      if (!code || !visitedCodes.has(code)) {
        return {
          fillOpacity: 0,
          strokeWeight: 0,
        };
      }
      const style = COUNTRY_FLAG_STYLES[code];
      if (!style) {
        return {
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          strokeWeight: 0,
        };
      }
      return {
        fillColor: style.fill,
        fillOpacity: style.fillOpacity,
        strokeColor: "rgba(255,255,255,0.2)",
        strokeWeight: 1,
      };
    });

    dataLayer.setMap(map);
    dataLayerRef.current = dataLayer;

    return () => {
      dataLayer.setMap(null);
      dataLayerRef.current = null;
    };
  }, [map, geojson, visitedCodes]);

  return null;
}
