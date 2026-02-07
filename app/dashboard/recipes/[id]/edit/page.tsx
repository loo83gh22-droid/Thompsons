"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { updateRecipe } from "../../actions";

type Member = { id: string; name: string };
type JournalPhoto = {
  id: string;
  url: string;
  caption: string | null;
  journal_entries: { title: string; trip_date: string | null } | null;
};

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;
  const { activeFamilyId } = useFamily();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [journalPhotos, setJournalPhotos] = useState<JournalPhoto[]>([]);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [taughtById, setTaughtById] = useState("");
  const [occasions, setOccasions] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [addedById, setAddedById] = useState("");
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!activeFamilyId || !recipeId) {
      setLoading(false);
      return;
    }
    async function load() {
      const supabase = createClient();
      const [membersRes, recipeRes, photosRes, journalPhotosRes] = await Promise.all([
        supabase.from("family_members").select("id, name").eq("family_id", activeFamilyId).order("name"),
        supabase
          .from("recipes")
          .select("title, story, taught_by, occasions, ingredients, instructions, added_by")
          .eq("id", recipeId)
          .single(),
        supabase
          .from("recipe_photo_links")
          .select("journal_photo_id")
          .eq("recipe_id", recipeId),
        supabase
          .from("journal_photos")
          .select("id, url, caption, journal_entries(title, trip_date)")
          .eq("family_id", activeFamilyId)
          .order("id", { ascending: false })
          .limit(50),
      ]);

      if (membersRes.data) setMembers(membersRes.data as Member[]);
      if (recipeRes.data) {
        const r = recipeRes.data;
        setTitle(r.title || "");
        setStory(r.story || "");
        setTaughtById(r.taught_by || "");
        setOccasions(r.occasions || "");
        setIngredients(r.ingredients || "");
        setInstructions(r.instructions || "");
        setAddedById(r.added_by || "");
      }
      if (photosRes.data) {
        setSelectedPhotoIds(new Set(photosRes.data.map((p) => p.journal_photo_id)));
      }
      if (journalPhotosRes.data) setJournalPhotos(journalPhotosRes.data as unknown as JournalPhoto[]);
      setLoading(false);
    }
    load();
  }, [recipeId, activeFamilyId]);

  function togglePhoto(id: string) {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateRecipe(recipeId, {
        title: title.trim(),
        story: story.trim() || undefined,
        taughtById: taughtById || undefined,
        occasions: occasions.trim() || undefined,
        ingredients: ingredients.trim() || undefined,
        instructions: instructions.trim() || undefined,
        addedById: addedById || undefined,
        photoIds: Array.from(selectedPhotoIds),
      });
      router.push(`/dashboard/recipes/${recipeId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <span className="text-[var(--muted)]">Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/dashboard/recipes/${recipeId}`}
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Back to recipe
      </Link>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
      >
        <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
          Edit recipe
        </h2>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Recipe name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Grandma's lasagna"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              The story
            </label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={4}
              placeholder="Who taught you? Where did it come from?"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Learned from / taught by
            </label>
            <select
              value={taughtById}
              onChange={(e) => setTaughtById(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="">Select...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Occasions
            </label>
            <input
              type="text"
              value={occasions}
              onChange={(e) => setOccasions(e.target.value)}
              placeholder="e.g. Christmas, Easter, Sunday dinners"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Ingredients
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Who added this
            </label>
            <select
              value={addedById}
              onChange={(e) => setAddedById(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="">Select...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {journalPhotos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">
                Link to photos from dinners
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {journalPhotos.map((photo) => {
                  const entry = Array.isArray(photo.journal_entries)
                    ? photo.journal_entries[0]
                    : photo.journal_entries;
                  const label = entry?.title || "Photo";
                  const selected = selectedPhotoIds.has(photo.id);
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => togglePhoto(photo.id)}
                      className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        selected
                          ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                          : "border-[var(--border)] hover:border-[var(--muted)]"
                      }`}
                      title={label}
                    >
                      <Image
                        src={photo.url}
                        alt={photo.caption || label}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                      {selected && (
                        <span className="absolute right-1 top-1 rounded-full bg-[var(--accent)] p-1 text-white">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <Link
            href={`/dashboard/recipes/${recipeId}`}
            className="rounded-lg border border-[var(--border)] px-4 py-2 font-medium hover:bg-[var(--surface-hover)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
