"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";

type FamilyMember = { id: string; name: string; color: string; symbol: string };

export function AddLocationForm({ onAdded }: { onAdded?: () => void }) {
  const { activeFamilyId } = useFamily();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [familyMemberId, setFamilyMemberId] = useState("");
  const [locationKind, setLocationKind] = useState<"travel" | "lived" | "vacation" | "memorable_event" | "other">("travel");
  const [locationName, setLocationName] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [yearVisited, setYearVisited] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [tripDateEnd, setTripDateEnd] = useState("");
  const [notes, setNotes] = useState("");

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
        // Supabase not configured or network error; leave members empty
      }
    }
    fetchMembers();
  }, [activeFamilyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Geocode location name using Google Geocoding API
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error("Google Maps API key is not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local");
      }
      const geocodeRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationName)}&key=${apiKey}`
      );
      const geocode = await geocodeRes.json();
      if (geocode.status !== "OK" || !geocode.results?.[0]) {
        throw new Error("Could not find that location. Try a more specific place name.");
      }
      const result = geocode.results[0];
      const loc = result.geometry.location;
      const lat = loc.lat;
      const lng = loc.lng;
      const countryComp = result.address_components?.find((c: { types: string[] }) =>
        c.types.includes("country")
      );
      const countryCode = countryComp?.short_name?.toUpperCase() || null;

      if (!lat || !lng) {
        throw new Error("Could not find coordinates for that location. Try a more specific place name.");
      }

      if (!activeFamilyId) {
        setError("No active family selected.");
        return;
      }
      const { error: insertError } = await supabase.from("travel_locations").insert({
        family_id: activeFamilyId,
        family_member_id: familyMemberId,
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
          locationKind === "vacation"
            ? "vacation"
            : locationKind === "memorable_event"
              ? "memorable_event"
              : locationKind === "other"
                ? "other"
                : null,
        location_label: locationLabel.trim() || null,
      });

      if (insertError) throw insertError;

      setFamilyMemberId("");
      setLocationKind("travel");
      setLocationName("");
      setLocationLabel("");
      setYearVisited("");
      setTripDate("");
      setTripDateEnd("");
      setNotes("");
      setOpen(false);
      onAdded?.();
      window.dispatchEvent(new Event("map-refresh"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
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
          <label className="block text-sm font-medium text-[var(--muted)]">
            Type
          </label>
          <div className="mt-2 flex flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="locationKind"
                checked={locationKind === "travel"}
                onChange={() => setLocationKind("travel")}
                className="rounded-full border-[var(--border)] text-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">Travel / visit</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="locationKind"
                checked={locationKind === "lived"}
                onChange={() => setLocationKind("lived")}
                className="rounded-full border-[var(--border)] text-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">Homes (lived here)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="locationKind"
                checked={locationKind === "vacation"}
                onChange={() => setLocationKind("vacation")}
                className="rounded-full border-[var(--border)] text-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">Vacation</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="locationKind"
                checked={locationKind === "memorable_event"}
                onChange={() => setLocationKind("memorable_event")}
                className="rounded-full border-[var(--border)] text-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">Memorable event</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="locationKind"
                checked={locationKind === "other"}
                onChange={() => setLocationKind("other")}
                className="rounded-full border-[var(--border)] text-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">Other</span>
            </label>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            e.g. wedding, sports event, reunion. Use Other + label for school, first job, etc.
          </p>
        </div>

        {locationKind === "other" && (
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Label (optional)
            </label>
            <input
              type="text"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder="e.g. School, First job"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)]"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            {locationKind === "lived"
              ? "Who lived here?"
              : locationKind === "vacation"
                ? "Who was on this vacation?"
                : locationKind === "memorable_event"
                  ? "Who was at this event?"
                  : locationKind === "other"
                    ? "Who is this for?"
                    : "Who traveled here?"}
          </label>
          <select
            value={familyMemberId}
            onChange={(e) => setFamilyMemberId(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)]"
          >
            <option value="">Select...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {locationKind === "lived"
              ? "Pick the person (or Family if you lived there together)."
              : 'Choose "Family" for trips or events you did together.'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Location name
          </label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            required
            placeholder="e.g. Paris, France"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)]"
          />
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
          <label className="block text-sm font-medium text-[var(--muted)]">
            Notes (optional)
          </label>
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
        <div className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50"
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
