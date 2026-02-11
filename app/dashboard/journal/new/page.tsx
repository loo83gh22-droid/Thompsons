"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { createJournalEntry } from "../actions";
import DatePicker, { type DateRange } from "@/app/components/DatePicker";
import LocationInput from "@/app/components/LocationInput";
import PhotoUpload from "@/app/components/PhotoUpload";
import { extractMetadataFromMultiplePhotos } from "@/src/lib/exifExtractor";

type FamilyMember = { id: string; name: string; color: string; symbol: string };
type DateValue = Date | DateRange;

export default function NewJournalPage() {
  const { activeFamilyId } = useFamily();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState<DateValue>(() => new Date());
  const [location, setLocation] = useState<{ name: string; latitude: number; longitude: number }>({
    name: "",
    latitude: 0,
    longitude: 0,
  });
  const [locationType, setLocationType] = useState<"visit" | "vacation" | "memorable_event">("visit");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);

  useEffect(() => {
    if (!activeFamilyId) return;
    async function fetchMembers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("family_members")
        .select("id, name, color, symbol")
        .eq("family_id", activeFamilyId)
        .order("name");
      if (data) setMembers(data as FamilyMember[]);
    }
    fetchMembers();
  }, [activeFamilyId]);

  const handlePhotoChange = useCallback((files: File[], coverIndex: number) => {
    setPhotoFiles(files);
    setCoverPhotoIndex(coverIndex);
    if (files.length > 0) {
      extractMetadataFromMultiplePhotos(files).then((metadata) => {
        if (metadata.date) setDate(metadata.date as Date);
      });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const form = e.currentTarget;
      const formData = new FormData();
      formData.set("family_member_id", (form.elements.namedItem("family_member_id") as HTMLSelectElement).value);
      formData.set("title", (form.elements.namedItem("title") as HTMLInputElement).value);
      formData.set("content", (form.elements.namedItem("content") as HTMLTextAreaElement).value);
      const startDate = date instanceof Date ? date : date.start;
      const endDate = date instanceof Date ? null : date.end;
      formData.set("trip_date", startDate.toISOString().split("T")[0]);
      if (endDate) formData.set("trip_date_end", endDate.toISOString().split("T")[0]);
      formData.set("location", location.name || "");
      formData.set("location_type", locationType);
      if (location.latitude && location.longitude) {
        formData.set("location_lat", String(location.latitude));
        formData.set("location_lng", String(location.longitude));
      }

      const orderedPhotos =
        photoFiles.length === 0
          ? []
          : coverPhotoIndex === 0
            ? photoFiles
            : [
                photoFiles[coverPhotoIndex],
                ...photoFiles.slice(0, coverPhotoIndex),
                ...photoFiles.slice(coverPhotoIndex + 1),
              ];
      orderedPhotos.forEach((file) => formData.append("photos", file));

      const result = await createJournalEntry(formData);
      if (result?.success) {
        window.location.href = "/dashboard/journal";
        return;
      }
      setError(result?.error ?? "Something went wrong.");
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : err instanceof Error
            ? err.message
            : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link
        href="/dashboard/journal"
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Back to journal
      </Link>

      <h1 className="mt-6 font-display text-3xl font-bold text-[var(--foreground)]">
        New journal entry
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Tell your story — trips, birthdays, celebrations. Add photos and a location to create a pin on the map.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Who is this about?
          </label>
          <select
            name="family_member_id"
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">
              {members.length === 0 ? "Loading..." : "Select person or Family..."}
            </option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Choose &quot;Family&quot; for trips you took together. This also sets the map pin colour.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Title
          </label>
          <input
            name="title"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            placeholder="Summer in the mountains"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <LocationInput
            value={location.name}
            onChange={setLocation}
            label="Location"
            required={false}
          />
          <DatePicker
            value={date}
            onChange={setDate}
            label="Date"
            required={false}
            allowRange
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Map pin type
          </label>
          <select
            value={locationType}
            onChange={(e) => setLocationType(e.target.value as "visit" | "vacation" | "memorable_event")}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="visit">Just a visit</option>
            <option value="vacation">Vacation</option>
            <option value="memorable_event">Memorable event (wedding, sports, etc.)</option>
          </select>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Only used when you add a location. Changes the symbol on the family map.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Your story
          </label>
          <textarea
            name="content"
            rows={8}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            placeholder="What happened? What did you see? What will you remember?"
          />
        </div>

        <PhotoUpload onChange={handlePhotoChange} maxFiles={20} />

        {error && (
          <div className="rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || members.length === 0}
            className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save entry"}
          </button>
          <Link
            href="/dashboard/journal"
            className="rounded-lg border border-[var(--border)] px-6 py-3 font-medium hover:bg-[var(--surface)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
