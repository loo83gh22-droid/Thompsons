"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import { createJournalEntry } from "../actions";

type FamilyMember = { id: string; name: string; color: string; symbol: string };

export default function NewJournalPage() {
  const router = useRouter();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      await createJournalEntry(formData);
      router.push("/dashboard/journal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Location
            </label>
            <input
              name="location"
              type="text"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              placeholder="e.g. Colorado, USA or Paris, France"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Adds a pin to the Travel Map for the person/family you selected.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Date
            </label>
            <input
              name="trip_date"
              type="date"
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
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            placeholder="What happened? What did you see? What will you remember?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Photos
          </label>
          <input
            name="photos"
            type="file"
            accept="image/*"
            multiple
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:font-semibold file:text-[var(--background)]"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            You can select multiple images at once.
          </p>
        </div>

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
