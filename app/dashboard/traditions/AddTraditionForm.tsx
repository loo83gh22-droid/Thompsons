"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { addTradition } from "./actions";

type Member = { id: string; name: string };

export function AddTraditionForm() {
  const router = useRouter();
  const { activeFamilyId } = useFamily();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [whenItHappens, setWhenItHappens] = useState("");
  const [addedById, setAddedById] = useState("");

  useEffect(() => {
    if (!activeFamilyId) return;
    async function fetchMembers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("family_members")
        .select("id, name")
        .eq("family_id", activeFamilyId)
        .order("name");
      if (data) setMembers(data as Member[]);
    }
    fetchMembers();
  }, [activeFamilyId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await addTradition({
        title: title.trim(),
        description: description.trim(),
        whenItHappens: whenItHappens.trim() || undefined,
        addedById: addedById || undefined,
      });
      setTitle("");
      setDescription("");
      setWhenItHappens("");
      setAddedById("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        data-add-tradition
        onClick={() => setOpen(true)}
        className="min-h-[44px] rounded-full bg-[var(--primary)] px-4 py-2 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
      >
        + Add tradition
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">
        Add a tradition
      </h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Chants, rituals, inside jokes — the cultural DNA that gets lost between generations.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Name *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Taco Tuesday chant, Christmas Eve ritual"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            When it happens
          </label>
          <input
            type="text"
            value={whenItHappens}
            onChange={(e) => setWhenItHappens(e.target.value)}
            placeholder="e.g. Every Tuesday, Christmas Eve, when someone says X"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            The tradition *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            placeholder="The chant, the ritual, the inside joke — document it all so it doesn't get lost."
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
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
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

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
          className="rounded-lg border border-[var(--border)] px-4 py-2 font-medium hover:bg-[var(--surface-hover)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
