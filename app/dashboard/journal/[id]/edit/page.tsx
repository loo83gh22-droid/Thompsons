"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import {
  updateJournalEntry,
  addJournalPhotos,
  deleteJournalPhoto,
} from "../../actions";
import { DeleteJournalEntryButton } from "../../DeleteJournalEntryButton";
import { JournalPerspectives } from "../../JournalPerspectives";

type FamilyMember = { id: string; name: string; color: string; symbol: string };
type JournalPhoto = { id: string; url: string; caption: string | null };

export default function EditJournalPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;
  const { activeFamilyId } = useFamily();

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [entry, setEntry] = useState<{
    title: string;
    content: string;
    location: string;
    trip_date: string;
    trip_date_end: string;
    author_id: string;
  } | null>(null);
  const [photos, setPhotos] = useState<JournalPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingPhotos, setAddingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeFamilyId) {
      setLoading(false);
      return;
    }
    async function load() {
      const supabase = createClient();
      const [membersRes, entryRes, photosRes] = await Promise.all([
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
      formData.set("family_member_id", entry.author_id);
      formData.set("title", entry.title);
      formData.set("content", entry.content);
      formData.set("location", entry.location);
      formData.set("trip_date", entry.trip_date);
      if (entry.trip_date_end) formData.set("trip_date_end", entry.trip_date_end);
      await updateJournalEntry(entryId, formData);
      router.push("/dashboard/journal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPhotos(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const files = formData.getAll("photos") as File[];
    if (files.every((f) => f.size === 0)) {
      setAddingPhotos(false);
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
        Update the story or add more photos.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Who is this about?
          </label>
          <select
            name="family_member_id"
            required
            value={entry.author_id}
            onChange={(e) =>
              setEntry((prev) => prev && { ...prev, author_id: e.target.value })
            }
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

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
          <div className="rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50"
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

        {addingPhotos ? (
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
                className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--background)]"
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
        ) : (
          <button
            type="button"
            onClick={() => setAddingPhotos(true)}
            className="mt-4 rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-hover)]"
          >
            + Add more photos
          </button>
        )}
      </div>

      <JournalPerspectives entryId={entryId} />
    </div>
  );
}
