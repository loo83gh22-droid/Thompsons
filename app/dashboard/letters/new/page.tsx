"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { createLetter } from "../actions";

type FamilyMember = { id: string; name: string; color: string | null };

export default function NewLetterPage() {
  const router = useRouter();
  const { activeFamilyId } = useFamily();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [toMemberId, setToMemberId] = useState("");
  const [sealToggle, setSealToggle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!activeFamilyId) return;
    const supabase = createClient();
    supabase
      .from("family_members")
      .select("id, name, color")
      .eq("family_id", activeFamilyId)
      .order("name")
      .then(({ data }) => {
        if (data) setMembers(data as FamilyMember[]);
      });
  }, [activeFamilyId]);

  const selectedMember = members.find((m) => m.id === toMemberId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (!sealToggle) formData.delete("deliver_at_age");
    const result = await createLetter(formData);
    if (result?.success) {
      router.push("/dashboard/letters");
    } else {
      setError(result?.error ?? "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/letters"
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Back to letters
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
        Write a letter
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Personal, private, and addressed to someone you love.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">To</label>
          <select
            name="to_member_id"
            value={toMemberId}
            onChange={(e) => setToMemberId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Select a family member…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Date written</label>
          <input
            name="written_on"
            type="date"
            defaultValue={today}
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Title <span className="font-normal text-xs">(optional)</span>
          </label>
          <input
            name="title"
            type="text"
            placeholder={selectedMember ? `A letter to ${selectedMember.name}` : "Untitled"}
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Your letter</label>
          <textarea
            name="body"
            rows={10}
            required
            placeholder="Write what's in your heart. They'll read this someday."
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none text-base leading-relaxed"
          />
        </div>

        {/* Seal until age — toggle */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={sealToggle}
              onChange={(e) => setSealToggle(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
            />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Seal this letter until a certain age
            </span>
          </label>
          {sealToggle && (
            <div className="mt-3 space-y-2">
              <label className="block text-sm text-[var(--muted)]">
                Seal until{" "}
                {selectedMember ? <strong>{selectedMember.name}</strong> : "they"} turns age:
              </label>
              <input
                name="deliver_at_age"
                type="number"
                min={1}
                max={100}
                placeholder="e.g. 18"
                className="w-32 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              />
              <p className="text-xs text-[var(--muted)]">
                This letter will be visible to you. It&apos;s a note to yourself about when to share it.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="min-h-[48px] flex-1 rounded-full bg-[var(--primary)] px-6 py-3 font-semibold text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 sm:flex-none"
          >
            {loading ? "Saving…" : "Send to the nest"}
          </button>
          <Link
            href="/dashboard/letters"
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[var(--border)] px-6 py-3 font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
