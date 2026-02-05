"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";

type FamilyMember = { id: string; name: string; color: string; symbol: string };

export function AddLocationForm({ onAdded }: { onAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [familyMemberId, setFamilyMemberId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [yearVisited, setYearVisited] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function fetchMembers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("family_members")
        .select("id, name, color, symbol")
        .order("name");
      if (data) setMembers(data as FamilyMember[]);
    }
    fetchMembers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Geocode location name to get coordinates
      // User can manually add lat/lng later or we use a geocoding API
      const geocodeRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(locationName)}&limit=1`,
        { headers: { "User-Agent": "Thompsons-Family-Site/1.0" } }
      );
      const geocode = await geocodeRes.json();
      const result = geocode[0];
      const lat = result?.lat ? parseFloat(result.lat) : 0;
      const lng = result?.lon ? parseFloat(result.lon) : 0;
      const countryCode = result?.address?.country_code?.toUpperCase() || null;

      if (!lat || !lng) {
        throw new Error("Could not find coordinates for that location. Try a more specific place name.");
      }

      const { error: insertError } = await supabase.from("travel_locations").insert({
        family_member_id: familyMemberId,
        lat,
        lng,
        location_name: locationName,
        year_visited: yearVisited ? parseInt(yearVisited, 10) : null,
        trip_date: tripDate || null,
        notes: notes || null,
        country_code: countryCode,
      });

      if (insertError) throw insertError;

      setFamilyMemberId("");
      setLocationName("");
      setYearVisited("");
      setTripDate("");
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
        Add travel location
      </h3>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Who traveled here?
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
            Choose &quot;Family&quot; for trips you took together.
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
              Year visited
            </label>
            <input
              type="number"
              value={yearVisited}
              onChange={(e) => setYearVisited(e.target.value)}
              placeholder="2024"
              min="1900"
              max="2100"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Trip date (optional)
            </label>
            <input
              type="date"
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)]"
            />
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
