"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { updateLetter } from "../../actions";

type FamilyMember = { id: string; name: string; color: string | null };

type Letter = {
  id: string;
  title: string | null;
  body: string;
  written_on: string;
  deliver_at_age: number | null;
  to_member_id: string | null;
  from_member_id: string | null;
};

export default function EditLetterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { activeFamilyId } = useFamily();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [letter, setLetter] = useState<Letter | null>(null);
  const [sealToggle, setSealToggle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [letterId, setLetterId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => setLetterId(id));
  }, [params]);

  useEffect(() => {
    if (!activeFamilyId || !letterId) return;
    const supabase = createClient();
    Promise.all([
      supabase
        .from("family_members")
        .select("id, name, color")
        .eq("family_id", activeFamilyId)
        .order("name"),
      supabase
        .from("family_letters")
        .select("id, title, body, written_on, deliver_at_age, to_member_id, from_member_id")
        .eq("id", letterId)
        .eq("family_id", activeFamilyId)
        .single(),
    ]).then(([membersRes, letterRes]) => {
      if (membersRes.data) setMembers(membersRes.data as FamilyMember[]);
      if (letterRes.data) {
        setLetter(letterRes.data as Letter);
        setSealToggle(!!letterRes.data.deliver_at_age);
      }
    });
  }, [activeFamilyId, letterId]);

  const selectedMember = members.find((m) => m.id === letter?.to_member_id);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!letterId) return;
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (!sealToggle) formData.delete("deliver_at_age");
    const result = await updateLetter(letterId, formData);
    if (result?.success) {
      router.push(`/dashboard/letters/${letterId}`);
    } else {
      setError(result?.error ?? "Something went wrong.");
      setLoading(false);
    }
  }

  if (!letter) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        href={`/dashboard/letters/${letter.id}`}
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Back to letter
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
        Edit letter
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">To</label>
          <select
            name="to_member_id"
            defaultValue={letter.to_member_id ?? ""}
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
            defaultValue={letter.written_on}
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
            defaultValue={letter.title ?? ""}
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
            defaultValue={letter.body}
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none text-base leading-relaxed"
          />
        </div>

        {/* Seal until age */}
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
                defaultValue={letter.deliver_at_age ?? ""}
                placeholder="e.g. 18"
                className="w-32 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              />
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
            {loading ? "Saving…" : "Save changes"}
          </button>
          <Link
            href={`/dashboard/letters/${letter.id}`}
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[var(--border)] px-6 py-3 font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
