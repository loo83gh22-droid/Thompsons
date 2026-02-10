"use client";

import { useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

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
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["(regions)"],
      fields: ["formatted_address", "geometry", "name"],
    });

    const listener = () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.geometry?.location) {
        const location = {
          name: (place.formatted_address as string) || (place.name as string) || "",
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        };
        setInputValue(location.name);
        onChange(location);
      }
    };

    autocompleteRef.current.addListener("place_changed", listener);
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange]);

  const handleCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setUseCurrentLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (!isLoaded) {
          setInputValue(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          onChange({ name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, latitude, longitude });
          setUseCurrentLocation(false);
          return;
        }
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            const location = {
              name: results[0].formatted_address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              latitude,
              longitude,
            };
            setInputValue(location.name);
            onChange(location);
          } else {
            setInputValue(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            onChange({ name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, latitude, longitude });
          }
          setUseCurrentLocation(false);
        });
      },
      () => {
        alert("Unable to get your location. Please enter manually.");
        setUseCurrentLocation(false);
      }
    );
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--muted)]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g., Colorado, USA or Paris, France"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          required={required}
        />
        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={useCurrentLocation || !isLoaded}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Use current location"
        >
          {useCurrentLocation ? (
            <span className="animate-spin">⟳</span>
          ) : (
            <span aria-hidden>📍</span>
          )}
        </button>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Adds a pin to the Travel Map for the person/family you selected.
      </p>
    </div>
  );
}
