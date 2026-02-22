"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { canEditMap } from "@/src/lib/plans";
import Link from "next/link";
import { MemberSelect } from "@/app/components/MemberSelect";

type FamilyMember = { id: string; name: string; color: string | null; symbol: string };

type GeocodeSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
  address?: { country_code?: string };
};

export function AddLocationForm({ onAdded }: { onAdded?: () => void }) {
  const { activeFamilyId, planType } = useFamily();
  const mapEditAllowed = canEditMap(planType);
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [locationKind, setLocationKind] = useState<"travel" | "lived" | "vacation" | "memorable_event" | "other">("travel");
  const [locationName, setLocationName] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [yearVisited, setYearVisited] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [tripDateEnd, setTripDateEnd] = useState("");
  const [notes, setNotes] = useState("");

  // Geocoded coordinates
  const [resolvedLat, setResolvedLat] = useState<number | null>(null);
  const [resolvedLng, setResolvedLng] = useState<number | null>(null);
  const [resolvedCountry, setResolvedCountry] = useState<string | null>(null);

  // Autocomplete suggestions from Nominatim
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!activeFamilyId) return;
    async function fetchMembers() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("family_members")
          .select("id, name, color, symbol")
          .eq("family_id", activeFamilyId)
          .order("name");
        if (data) setMembers(data as FamilyMember[]);
      } catch {
        // network error; leave members empty
      }
    }
    fetchMembers();
  }, [activeFamilyId]);

  function handleLocationInput(value: string) {
    setLocationName(value);
    setResolvedLat(null);
    setResolvedLng(null);
    setResolvedCountry(null);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        // Try Google Geocoding API first if key available, else Nominatim
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(value)}&key=${apiKey}`
          );
          const json = await res.json();
          if (json.status === "OK" && json.results?.length) {
            const mapped: GeocodeSuggestion[] = json.results.slice(0, 5).map((r: {
              formatted_address: string;
              geometry: { location: { lat: number; lng: number } };
              address_components?: { types: string[]; short_name: string }[];
            }) => {
              const cc = r.address_components?.find((c) => c.types.includes("country"));
              return {
                display_name: r.formatted_address,
                lat: String(r.geometry.location.lat),
                lon: String(r.geometry.location.lng),
                address: { country_code: cc?.short_name?.toLowerCase() },
              };
            });
            setSuggestions(mapped);
            setShowSuggestions(true);
            return;
          }
        }
        // Fallback to Nominatim
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(value)}&limit=5`,
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
    setLocationName(s.display_name);
    setResolvedLat(parseFloat(s.lat));
    setResolvedLng(parseFloat(s.lon));
    setResolvedCountry(s.address?.country_code?.toUpperCase() || null);
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  }

  async function geocodeFallback(query: string): Promise<{
    lat: number; lng: number; country: string | null;
  } | null> {
    try {
      // Try Google first
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
        );
        const json = await res.json();
        if (json.status === "OK" && json.results?.[0]) {
          const loc = json.results[0].geometry.location;
          const countryComp = json.results[0].address_components?.find(
            (c: { types: string[] }) => c.types.includes("country")
          );
          return { lat: loc.lat, lng: loc.lng, country: countryComp?.short_name?.toUpperCase() || null };
        }
      }
      // Fallback to Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { "User-Agent": "FamilyNest/1.0" } }
      );
      const json = await res.json();
      if (json[0]?.lat && json[0]?.lon) {
        return {
          lat: parseFloat(json[0].lat),
          lng: parseFloat(json[0].lon),
          country: json[0].address?.country_code?.toUpperCase() || null,
        };
      }
    } catch {
      // fall through
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      let lat = resolvedLat;
      let lng = resolvedLng;
      let countryCode = resolvedCountry;

      if (lat === null || lng === null) {
        const fallback = await geocodeFallback(locationName);
        if (fallback) {
          lat = fallback.lat;
          lng = fallback.lng;
          countryCode = fallback.country;
        } else {
          throw new Error(
            "Could not find that location. Try selecting from the dropdown suggestions, or enter a more specific address."
          );
        }
      }

      if (!activeFamilyId) {
        setError("No active family selected.");
        return;
      }
      const { data: locRow, error: insertError } = await supabase.from("travel_locations").insert({
        family_id: activeFamilyId,
        family_member_id: selectedMemberIds[0] || null,
        lat,
        lng,
        location_name: locationName,
        year_visited: yearVisited ? parseInt(yearVisited, 10) : null,
        trip_date: tripDate || null,
        trip_date_end: tripDateEnd || null,
        notes: notes || null,
        country_code: countryCode,
        is_place_lived: locationKind === "lived",
        location_type:
          locationKind === "vacation" ? "vacation"
            : locationKind === "memorable_event" ? "memorable_event"
              : locationKind === "other" ? "other" : null,
        location_label: locationLabel.trim() || null,
      }).select("id").single();

      if (insertError) throw insertError;

      if (locRow?.id && selectedMemberIds.length > 0) {
        await supabase.from("travel_location_members").insert(
          selectedMemberIds.map((memberId) => ({
            travel_location_id: locRow.id,
            family_member_id: memberId,
          }))
        );
      }

      setSelectedMemberIds([]);
      setLocationKind("travel");
      setLocationName("");
      setLocationLabel("");
      setYearVisited("");
      setTripDate("");
      setTripDateEnd("");
      setNotes("");
      setResolvedLat(null);
      setResolvedLng(null);
      setResolvedCountry(null);
      setOpen(false);
      onAdded?.();
      window.dispatchEvent(new Event("map-refresh"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!mapEditAllowed) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
        Map is view-only on the free plan.{" "}
        <Link href="/pricing" className="text-[var(--accent)] hover:underline">Upgrade</Link> to add locations.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
      >
        + Add location
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">
        Add location
      </h3>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Type</label>
          <div className="mt-2 flex flex-wrap gap-3">
            {([
              ["travel", "Travel / visit"],
              ["lived", "Homes (lived here)"],
              ["vacation", "Vacation"],
              ["memorable_event", "Memorable event"],
              ["other", "Other"],
            ] as const).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="locationKind"
                  checked={locationKind === value}
                  onChange={() => setLocationKind(value)}
                  className="rounded-full border-[var(--border)] text-[var(--accent)]"
                />
                <span className="text-sm text-[var(--foreground)]">{label}</span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            e.g. wedding, sports event, reunion. Use Other + label for school, first job, etc.
          </p>
        </div>

        {locationKind === "other" && (
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">Label (optional)</label>
            <input
              type="text"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder="e.g. School, First job"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)]"
            />
          </div>
        )}

        <MemberSelect
          members={members}
          selectedIds={selectedMemberIds}
          onChange={setSelectedMemberIds}
          label={locationKind === "lived" ? "Who lived here?"
            : locationKind === "vacation" ? "Who was on this vacation?"
              : locationKind === "memorable_event" ? "Who was at this event?"
                : locationKind === "other" ? "Who is this for?" : "Who traveled here?"}
          hint="Select everyone who was there, or use Select All for the whole family."
          required
        />

        <div ref={wrapperRef} className="relative">
          <label className="block text-sm font-medium text-[var(--muted)]">Location</label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => handleLocationInput(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            required
            placeholder="Start typing an address, city, or place..."
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)]"
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg">
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
          <p className="mt-1 text-xs text-[var(--muted)]">
            {resolvedLat !== null
              ? "Location found"
              : "Type and pick from the dropdown, or enter any address."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              {locationKind === "lived" ? "Lived from (optional)" : "Year visited"}
            </label>
            {locationKind === "lived" ? (
              <input
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)]"
              />
            ) : (
              <input
                type="number"
                value={yearVisited}
                onChange={(e) => setYearVisited(e.target.value)}
                placeholder="2024"
                min="1900"
                max="2100"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)]"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              {locationKind === "lived" ? "Lived until (optional)" : "Trip date (optional)"}
            </label>
            {locationKind === "lived" ? (
              <input
                type="date"
                value={tripDateEnd}
                onChange={(e) => setTripDateEnd(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)]"
              />
            ) : (
              <input
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)]"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Summer vacation"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)]"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      <div className="mt-6 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[var(--primary)] px-4 py-2 font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-[var(--border)] px-4 py-2 hover:bg-[var(--surface-hover)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
