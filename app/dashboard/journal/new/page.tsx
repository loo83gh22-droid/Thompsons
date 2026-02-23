"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { createJournalEntry, registerJournalVideo } from "../actions";
import { generateJournalPrompts } from "../prompts";
import DatePicker, { type DateRange } from "@/app/components/DatePicker";
import LocationInput from "@/app/components/LocationInput";
import PhotoUpload from "@/app/components/PhotoUpload";
import { extractMetadataFromMultiplePhotos } from "@/src/lib/exifExtractor";
import { canUploadVideos } from "@/src/lib/plans";
import { MemberSelect } from "@/app/components/MemberSelect";

type FamilyMember = { id: string; name: string; color: string | null; symbol: string };
type DateValue = Date | DateRange;

export default function NewJournalPage() {
  const { activeFamilyId, planType, currentMemberId } = useFamily();
  const videosAllowed = canUploadVideos(planType);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    currentMemberId ? [currentMemberId] : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);

  const [date, setDate] = useState<DateValue>(() => new Date());
  const [location, setLocation] = useState<{ name: string; latitude: number; longitude: number }>({
    name: "",
    latitude: 0,
    longitude: 0,
  });
  const [locationType, setLocationType] = useState<"visit" | "vacation" | "memorable_event">("visit");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
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

  const handleVideoChange = useCallback((files: File[]) => {
    setVideoFiles(files);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const form = e.currentTarget;
      const formData = new FormData();
      // member_ids are set via hidden inputs from MemberSelect
      selectedMemberIds.forEach((id) => formData.append("member_ids", id));
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
      // Videos are NOT sent through the server action (too large for Vercel payload limit).
      // They are uploaded directly to Supabase Storage client-side after entry creation.

      const result = await createJournalEntry(formData);
      if (result?.success) {
        // Upload videos client-side if any
        if (videoFiles.length > 0) {
          const supabase = createClient();
          for (const file of videoFiles) {
            const ext = file.name.split(".").pop() || "mp4";
            const storagePath = `${result.id}/${crypto.randomUUID()}.${ext}`;
            const { error: uploadError } = await supabase.storage
              .from("journal-videos")
              .upload(storagePath, file, { upsert: true });
            if (uploadError) continue;
            const { data: urlData } = supabase.storage
              .from("journal-videos")
              .getPublicUrl(storagePath);
            await registerJournalVideo(result.id, urlData.publicUrl, storagePath, file.size, null);
          }
        }
        const hadLocation = !!(location.name?.trim() || (location.latitude && location.longitude));
        window.location.href = hadLocation ? "/dashboard/journal?addedToMap=1" : "/dashboard/journal";
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
        <MemberSelect
          members={members}
          selectedIds={selectedMemberIds}
          onChange={setSelectedMemberIds}
          label="Who's in this story?"
          hint="Select everyone involved. You're included by default as the author."
          required
          name="member_ids"
        />

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
          <div>
            <LocationInput
              value={location.name}
              onChange={setLocation}
              label="Location"
              required={false}
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Add a location to create a pin on the Family Map.
            </p>
          </div>
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
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-[var(--muted)]">
              Your story
            </label>
            <button
              type="button"
              onClick={async () => {
                setIsGeneratingPrompts(true);
                const result = await generateJournalPrompts({
                  location: location.name || undefined,
                  date: date instanceof Date ? date.toISOString().slice(0, 10) : undefined,
                  members: members.filter((_, i) => {
                    const checkbox = document.querySelector<HTMLInputElement>(`input[value="${members[i]?.id}"]`);
                    return checkbox?.checked;
                  }).map(m => m.name),
                });
                setIsGeneratingPrompts(false);
                if (result.success && result.prompts) {
                  setPrompts(result.prompts);
                }
              }}
              disabled={isGeneratingPrompts}
              className="text-sm font-medium text-[var(--primary)] hover:underline disabled:opacity-50"
            >
              {isGeneratingPrompts ? "Generating..." : "✨ Get writing ideas"}
            </button>
          </div>
          {prompts.length > 0 && (
            <div className="mt-2 mb-2 space-y-1">
              {prompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const textarea = document.querySelector<HTMLTextAreaElement>('textarea[name="content"]');
                    if (textarea) { textarea.value = prompt + " "; textarea.focus(); }
                    setPrompts([]);
                  }}
                  className="block w-full text-left rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  {prompt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPrompts([])}
                className="text-xs text-[var(--muted)] hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}
          <textarea
            name="content"
            rows={8}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            placeholder="What happened? What did you see? What will you remember?"
          />
        </div>

        <div>
          <PhotoUpload
            onChange={handlePhotoChange}
            onVideoChange={handleVideoChange}
            maxFiles={5}
            maxVideos={2}
            allowVideos={videosAllowed}
          />
          {!videosAllowed && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              <Link href="/pricing" className="text-[var(--accent)] hover:underline">Upgrade to Full Nest</Link> to add videos to your journal entries.
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || members.length === 0 || selectedMemberIds.length === 0}
            className="rounded-full bg-[var(--primary)] px-6 py-3 font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
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
