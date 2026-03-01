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

function formatDateTitle(d: DateValue): string {
  const date = d instanceof Date ? d : d.start;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

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
  const [showOptionals, setShowOptionals] = useState(false);

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
  const [authorOverride, setAuthorOverride] = useState<string | null>(null);
  const [showAuthorPicker, setShowAuthorPicker] = useState(false);

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
      selectedMemberIds.forEach((id) => formData.append("member_ids", id));

      // Title is optional — fall back to a date-based title
      const rawTitle = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
      formData.set("title", rawTitle || formatDateTitle(date));

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
      if (authorOverride) formData.set("author_override", authorOverride);

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
        if (videoFiles.length > 0) {
          const supabase = createClient();
          for (const file of videoFiles) {
            const ext = file.name.split(".").pop() || "mp4";
            const storagePath = `${result.id}/${crypto.randomUUID()}.${ext}`;
            const { error: uploadError } = await supabase.storage
              .from("journal-videos")
              .upload(storagePath, file, { upsert: true });
            if (uploadError) continue;
            await registerJournalVideo(result.id, `/api/storage/journal-videos/${storagePath}`, storagePath, file.size, null);
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

      <h1 className="mt-4 font-display text-2xl font-bold text-[var(--foreground)] sm:mt-6 sm:text-3xl">
        New journal entry
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)] sm:mt-2">
        Capture the moment. Title and location are optional.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5 sm:mt-8 sm:space-y-6">
        {/* Who */}
        <MemberSelect
          members={members}
          selectedIds={selectedMemberIds}
          onChange={setSelectedMemberIds}
          label="Who's in this story?"
          hint="You're included by default."
          required
          name="member_ids"
        />

        {/* Story — front and center */}
        <div>
          <div className="flex items-center justify-between mb-1">
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
                  members: members
                    .filter((m) => selectedMemberIds.includes(m.id))
                    .map((m) => m.name),
                });
                setIsGeneratingPrompts(false);
                if (result.success && result.prompts) setPrompts(result.prompts);
              }}
              disabled={isGeneratingPrompts}
              className="text-sm font-medium text-[var(--primary)] hover:underline disabled:opacity-50"
            >
              {isGeneratingPrompts ? "Generating…" : "✨ Ideas"}
            </button>
          </div>
          {prompts.length > 0 && (
            <div className="mb-2 space-y-1">
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
              <button type="button" onClick={() => setPrompts([])} className="text-xs text-[var(--muted)] hover:underline">
                Dismiss
              </button>
            </div>
          )}
          <textarea
            name="content"
            rows={6}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none text-base"
            placeholder="What happened? What did you see? What will you remember?"
          />
        </div>

        {/* Photos */}
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
              <Link href="/pricing" className="text-[var(--accent)] hover:underline">Upgrade to Full Nest</Link> to add videos.
            </p>
          )}
        </div>

        {/* Optional details — collapsed on mobile by default */}
        <div className="rounded-xl border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setShowOptionals((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-expanded={showOptionals}
          >
            <span>+ Title, location &amp; date</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className={`transition-transform duration-200 ${showOptionals ? "rotate-180" : ""}`}
              aria-hidden
            >
              <path d="M3 6l5 5 5-5" />
            </svg>
          </button>

          {showOptionals && (
            <div className="border-t border-[var(--border)] px-4 pb-4 pt-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">
                  Title <span className="font-normal text-xs">(optional — defaults to today&apos;s date)</span>
                </label>
                <input
                  name="title"
                  type="text"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                  placeholder={formatDateTitle(date)}
                />
              </div>

              {/* Location */}
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

              {/* Date */}
              <DatePicker
                value={date}
                onChange={setDate}
                label="Date"
                required={false}
                allowRange
              />

              {/* Map pin type */}
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
              </div>

              {/* Author override */}
              <div>
                {!showAuthorPicker ? (
                  <button
                    type="button"
                    onClick={() => setShowAuthorPicker(true)}
                    className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:underline transition-colors"
                  >
                    Writing on behalf of someone? Change author
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-[var(--muted)]">Author:</label>
                    <select
                      value={authorOverride || ""}
                      onChange={(e) => setAuthorOverride(e.target.value || null)}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                    >
                      <option value="">Me (default)</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    {authorOverride && (
                      <button
                        type="button"
                        onClick={() => { setAuthorOverride(null); setShowAuthorPicker(false); }}
                        className="text-xs text-[var(--muted)] hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || members.length === 0 || selectedMemberIds.length === 0}
            className="min-h-[48px] flex-1 rounded-full bg-[var(--primary)] px-6 py-3 font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 sm:flex-none"
          >
            {loading ? "Saving…" : "Save entry"}
          </button>
          <Link
            href="/dashboard/journal"
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[var(--border)] px-6 py-3 font-medium hover:bg-[var(--surface)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
