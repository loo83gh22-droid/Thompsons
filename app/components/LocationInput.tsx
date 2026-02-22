"use client";

import { useEffect, useRef, useState } from "react";

type GeocodeSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
  address?: { country_code?: string };
};

interface LocationInputProps {
  value: string;
  onChange: (location: { name: string; latitude: number; longitude: number }) => void;
  label?: string;
  required?: boolean;
}

export default function LocationInput({
  value,
  onChange,
  label = "Location",
  required = false,
}: LocationInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInput(val: string) {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        // Try Google Geocoding API first if key available
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(val)}&key=${apiKey}`
          );
          const json = await res.json();
          if (json.status === "OK" && json.results?.length) {
            const mapped: GeocodeSuggestion[] = json.results.slice(0, 5).map((r: {
              formatted_address: string;
              geometry: { location: { lat: number; lng: number } };
              address_components?: { types: string[]; short_name: string }[];
            }) => ({
              display_name: r.formatted_address,
              lat: String(r.geometry.location.lat),
              lon: String(r.geometry.location.lng),
              address: { country_code: r.address_components?.find((c) => c.types.includes("country"))?.short_name?.toLowerCase() },
            }));
            setSuggestions(mapped);
            setShowSuggestions(true);
            return;
          }
        }
        // Fallback to Nominatim
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(val)}&limit=5`,
          { headers: { "User-Agent": "FamilyNest/1.0" } }
        );
        const json: GeocodeSuggestion[] = await res.json();
        setSuggestions(json);
        setShowSuggestions(json.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 350);
  }

  function selectSuggestion(s: GeocodeSuggestion) {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setInputValue(s.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange({ name: s.display_name, latitude: lat, longitude: lng });
  }

  const handleCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setUseCurrentLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Reverse geocode with Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "User-Agent": "FamilyNest/1.0" } }
          );
          const json = await res.json();
          const name = json.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setInputValue(name);
          onChange({ name, latitude, longitude });
        } catch {
          const name = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setInputValue(name);
          onChange({ name, latitude, longitude });
        }
        setUseCurrentLocation(false);
      },
      () => {
        alert("Unable to get your location. Please enter manually.");
        setUseCurrentLocation(false);
      }
    );
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <label className="block text-sm font-medium text-[var(--muted)]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="relative flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          placeholder="e.g., Colorado, USA or Paris, France"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          required={required}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={useCurrentLocation}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Use current location"
        >
          {useCurrentLocation ? (
            <span className="animate-spin">&#x27F3;</span>
          ) : (
            <span aria-hidden>&#x1F4CD;</span>
          )}
        </button>
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute left-0 right-12 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg">
            {suggestions.map((s, i) => (
              <li
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => selectSuggestion(s)}
                onKeyDown={(e) => { if (e.key === "Enter") selectSuggestion(s); }}
                className="cursor-pointer px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-[var(--muted)]">
        Adds a pin to the Travel Map for the person/family you selected.
      </p>
    </div>
  );
}
