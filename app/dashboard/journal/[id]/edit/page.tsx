"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { VIDEO_LIMITS } from "@/src/lib/constants";
import {
  updateJournalEntry,
  addJournalPhotos,
  deleteJournalPhoto,
  registerJournalVideo,
  deleteJournalVideo,
} from "../../actions";
import { DeleteJournalEntryButton } from "../../DeleteJournalEntryButton";
import { JournalPerspectives } from "../../JournalPerspectives";
import { MemberSelect } from "@/app/components/MemberSelect";

type FamilyMember = { id: string; name: string; color: string | null; symbol: string };
type JournalPhoto = { id: string; url: string; caption: string | null };
type JournalVideo = { id: string; url: string; duration_seconds: number | null; file_size_bytes: number };

export default function EditJournalPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;
  const { activeFamilyId } = useFamily();

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [entry, setEntry] = useState<{
    title: string;
    content: string;
    location: string;
    trip_date: string;
    trip_date_end: string;
    author_id: string;
  } | null>(null);
  const [photos, setPhotos] = useState<JournalPhoto[]>([]);
  const [videos, setVideos] = useState<JournalVideo[]>([]);
  const [locationType, setLocationType] = useState<"visit" | "vacation" | "memorable_event">("visit");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingPhotos, setAddingPhotos] = useState(false);
  const [addingVideos, setAddingVideos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeFamilyId) {
      setLoading(false);
      return;
    }
    async function load() {
      const supabase = createClient();
      const [membersRes, entryRes, photosRes, videosRes, pinRes, junctionRes] = await Promise.all([
        supabase.from("family_members").select("id, name, color, symbol").eq("family_id", activeFamilyId).order("name"),
        supabase
          .from("journal_entries")
          .select("title, content, location, trip_date, trip_date_end, author_id")
          .eq("id", entryId)
          .single(),
        supabase
          .from("journal_photos")
          .select("id, url, caption")
          .eq("entry_id", entryId)
          .order("sort_order"),
        supabase
          .from("journal_videos")
          .select("id, url, duration_seconds, file_size_bytes")
          .eq("entry_id", entryId)
          .order("sort_order"),
        supabase
          .from("travel_locations")
          .select("location_type")
          .eq("journal_entry_id", entryId)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("journal_entry_members")
          .select("family_member_id")
          .eq("journal_entry_id", entryId),
      ]);

      if (membersRes.data) setMembers(membersRes.data as FamilyMember[]);
      if (entryRes.data) {
        const e = entryRes.data as {
          title?: string;
          content?: string;
          location?: string;
          trip_date?: string;
          trip_date_end?: string;
          author_id?: string;
        };
        setEntry({
          title: e.title || "",
          content: e.content || "",
          location: e.location || "",
          trip_date: e.trip_date ? e.trip_date.slice(0, 10) : "",
          trip_date_end: e.trip_date_end ? e.trip_date_end.slice(0, 10) : "",
          author_id: e.author_id || "",
        });
      }
      if (photosRes.data) setPhotos(photosRes.data as JournalPhoto[]);
      if (videosRes.data) setVideos(videosRes.data as JournalVideo[]);
      // Load selected members from junction table, fall back to author_id
      const junctionIds = (junctionRes.data || []).map((r: { family_member_id: string }) => r.family_member_id);
      if (junctionIds.length > 0) {
        setSelectedMemberIds(junctionIds);
      } else if (entryRes.data) {
        const e = entryRes.data as { author_id?: string };
        if (e.author_id) setSelectedMemberIds([e.author_id]);
      }
      const pin = pinRes.data as { location_type?: string } | null;
      if (pin?.location_type === "vacation" || pin?.location_type === "memorable_event") {
        setLocationType(pin.location_type);
      }
      setLoading(false);
    }
    load();
  }, [entryId, activeFamilyId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!entry) return;
    setSaving(true);
    setError(null);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      selectedMemberIds.forEach((id) => formData.append("member_ids", id));
      formData.set("title", entry.title);
      formData.set("content", entry.content);
      formData.set("location", entry.location);
      formData.set("trip_date", entry.trip_date);
      formData.set("location_type", locationType);
      if (entry.trip_date_end) formData.set("trip_date_end", entry.trip_date_end);
      await updateJournalEntry(entryId, formData);
      const hadLocation = !!(entry.location?.trim());
      router.push(hadLocation ? "/dashboard/journal?addedToMap=1" : "/dashboard/journal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const JOURNAL_PHOTO_LIMIT = 5;

  async function handleAddPhotos(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const files = formData.getAll("photos") as File[];
    if (files.every((f) => f.size === 0)) {
      setAddingPhotos(false);
      return;
    }
    const validFiles = files.filter((f) => f.size > 0);
    const totalAfter = photos.length + validFiles.length;
    if (totalAfter > JOURNAL_PHOTO_LIMIT) {
      setError(`Each journal entry can have up to ${JOURNAL_PHOTO_LIMIT} photos. You have ${photos.length} and tried to add ${validFiles.length}. Remove some or add fewer.`);
      return;
    }
    setError(null);
    try {
      await addJournalPhotos(entryId, formData);
      const supabase = createClient();
      const { data } = await supabase
        .from("journal_photos")
        .select("id, url, caption")
        .eq("entry_id", entryId)
        .order("sort_order");
      if (data) setPhotos(data as JournalPhoto[]);
      (form.querySelector('input[name="photos"]') as HTMLInputElement).value = "";
      setAddingPhotos(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add photos.");
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm("Remove this photo?")) return;
    setError(null);
    try {
      await deleteJournalPhoto(photoId, entryId);
      setPhotos((p) => p.filter((x) => x.id !== photoId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove photo.");
    }
  }

  async function handleAddVideos(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const files = formData.getAll("videos") as File[];
    if (files.every((f) => f.size === 0)) {
      setAddingVideos(false);
      return;
    }
    const validFiles = files.filter((f) => f.size > 0 && f.size <= VIDEO_LIMITS.maxSizeBytes);
    const totalAfter = videos.length + validFiles.length;
    if (totalAfter > VIDEO_LIMITS.maxVideosPerJournalEntry) {
      setError(`Each journal entry can have up to ${VIDEO_LIMITS.maxVideosPerJournalEntry} videos. You have ${videos.length} and tried to add ${validFiles.length}.`);
      return;
    }
    setError(null);
    try {
      const supabase = createClient();

      // Upload each video directly to Supabase Storage from the client
      for (const file of validFiles) {
        const ext = file.name.split(".").pop() || "mp4";
        const storagePath = `${entryId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("journal-videos")
          .upload(storagePath, file, { upsert: true });

        if (uploadError) {
          setError(`Upload failed for "${file.name}": ${uploadError.message}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("journal-videos")
          .getPublicUrl(storagePath);

        // Register the video in the DB via server action (metadata only, no file)
        await registerJournalVideo(
          entryId,
          urlData.publicUrl,
          storagePath,
          file.size,
          null, // duration — not critical for registration
        );
      }

      // Refresh video list
      const { data } = await supabase
        .from("journal_videos")
        .select("id, url, duration_seconds, file_size_bytes")
        .eq("entry_id", entryId)
        .order("sort_order");
      if (data) setVideos(data as JournalVideo[]);
      (form.querySelector('input[name="videos"]') as HTMLInputElement).value = "";
      setAddingVideos(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add videos.");
    }
  }

  async function handleDeleteVideo(videoId: string) {
    if (!confirm("Remove this video?")) return;
    setError(null);
    try {
      await deleteJournalVideo(videoId, entryId);
      setVideos((v) => v.filter((x) => x.id !== videoId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove video.");
    }
  }

  if (loading || !entry) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <span className="text-[var(--muted)]">Loading...</span>
      </div>
    );
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
        Edit journal entry
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Update the story, add photos or videos.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <MemberSelect
          members={members}
          selectedIds={selectedMemberIds}
          onChange={setSelectedMemberIds}
          label="Who's in this story?"
          hint="Select everyone involved."
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
            value={entry.title}
            onChange={(e) =>
              setEntry((prev) => prev && { ...prev, title: e.target.value })
            }
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Location
            </label>
            <input
              name="location"
              type="text"
              value={entry.location}
              onChange={(e) =>
                setEntry((prev) => prev && { ...prev, location: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Add a location to create a pin on the Family Map.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Start date
            </label>
            <input
              name="trip_date"
              type="date"
              value={entry.trip_date}
              onChange={(e) =>
                setEntry((prev) => prev && { ...prev, trip_date: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              End date (optional)
            </label>
            <input
              name="trip_date_end"
              type="date"
              value={entry.trip_date_end}
              onChange={(e) =>
                setEntry((prev) => prev && { ...prev, trip_date_end: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
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
            Changes the symbol on the family map when this entry has a location.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Your story
          </label>
          <textarea
            name="content"
            rows={8}
            value={entry.content}
            onChange={(e) =>
              setEntry((prev) => prev && { ...prev, content: e.target.value })
            }
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[var(--primary)] px-6 py-3 font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <Link
            href="/dashboard/journal"
            className="rounded-lg border border-[var(--border)] px-6 py-3 font-medium hover:bg-[var(--surface)]"
          >
            Cancel
          </Link>
          <div className="ml-auto">
            <DeleteJournalEntryButton
              entryId={entryId}
              title={entry.title || "this entry"}
              variant="edit"
            />
          </div>
        </div>
      </form>

      {/* Photos section */}
      <div className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
          Photos
        </h2>

        {photos.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative h-40 w-40 overflow-hidden rounded-lg"
              >
                <Image
                  src={photo.url}
                  alt={photo.caption || "Photo"}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {photos.length < JOURNAL_PHOTO_LIMIT && addingPhotos ? (
          <form onSubmit={handleAddPhotos} className="mt-4 space-y-4">
            <input
              name="photos"
              type="file"
              accept="image/*"
              multiple
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:font-semibold file:text-[var(--background)]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-full bg-[var(--primary)] px-4 py-2 font-medium text-[var(--primary-foreground)]"
              >
                Add photos
              </button>
              <button
                type="button"
                onClick={() => setAddingPhotos(false)}
                className="rounded-lg border border-[var(--border)] px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : photos.length < JOURNAL_PHOTO_LIMIT ? (
          <button
            type="button"
            onClick={() => setAddingPhotos(true)}
            className="mt-4 rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-hover)]"
          >
            + Add more photos ({photos.length}/{JOURNAL_PHOTO_LIMIT})
          </button>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Maximum {JOURNAL_PHOTO_LIMIT} photos per entry. Remove one to add another.
          </p>
        )}
      </div>

      {/* Videos section */}
      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
          Videos
        </h2>

        {videos.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="group relative w-72 overflow-hidden rounded-lg bg-black"
              >
                {/* eslint-disable-next-line jsx-a11y/media-has-caption -- family home video */}
                <video
                  src={video.url}
                  controls
                  preload="metadata"
                  playsInline
                  className="h-48 w-full object-contain"
                />
                <div className="flex items-center justify-between bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)]">
                  <span>
                    {video.duration_seconds
                      ? `${Math.floor(video.duration_seconds / 60)}:${String(video.duration_seconds % 60).padStart(2, "0")}`
                      : "Video"}
                    {" · "}
                    {(video.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(video.id)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {videos.length < VIDEO_LIMITS.maxVideosPerJournalEntry && addingVideos ? (
          <form onSubmit={handleAddVideos} className="mt-4 space-y-4">
            <input
              name="videos"
              type="file"
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
              multiple
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:font-semibold file:text-[var(--background)]"
            />
            <p className="text-xs text-[var(--muted)]">
              Max 5 minutes, 300 MB per video. Keep the gems, not everything.
            </p>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-full bg-[var(--primary)] px-4 py-2 font-medium text-[var(--primary-foreground)]"
              >
                Upload video
              </button>
              <button
                type="button"
                onClick={() => setAddingVideos(false)}
                className="rounded-lg border border-[var(--border)] px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : videos.length < VIDEO_LIMITS.maxVideosPerJournalEntry ? (
          <button
            type="button"
            onClick={() => setAddingVideos(true)}
            className="mt-4 rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-hover)]"
          >
            + Add a video ({videos.length}/{VIDEO_LIMITS.maxVideosPerJournalEntry})
          </button>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Maximum {VIDEO_LIMITS.maxVideosPerJournalEntry} videos per entry. Remove one to add another.
          </p>
        )}
      </div>

      <JournalPerspectives entryId={entryId} />
    </div>
  );
}
