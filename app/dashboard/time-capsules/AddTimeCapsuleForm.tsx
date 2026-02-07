"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { createTimeCapsule } from "./actions";

type Member = { id: string; name: string; birth_date: string | null };

export function AddTimeCapsuleForm({ onAdded }: { onAdded?: () => void }) {
  const router = useRouter();
  const { activeFamilyId } = useFamily();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [toId, setToId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [useAge18, setUseAge18] = useState(false);

  useEffect(() => {
    if (!activeFamilyId) return;
    async function fetchMembers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("family_members")
        .select("id, name, birth_date")
        .eq("family_id", activeFamilyId)
        .order("name");
      if (data) setMembers(data as Member[]);
    }
    fetchMembers();
  }, [activeFamilyId]);

  function handleRecipientChange(memberId: string) {
    setToId(memberId);
    const member = members.find((m) => m.id === memberId);
    if (member?.birth_date && useAge18) {
      const [y, m, d] = member.birth_date.split("-").map(Number);
      setUnlockDate(`${y + 18}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
  }

  function handleAge18Toggle() {
    setUseAge18((prev) => !prev);
    if (!useAge18 && toId) {
      const member = members.find((m) => m.id === toId);
      if (member?.birth_date) {
        const [y, m, d] = member.birth_date.split("-").map(Number);
        setUnlockDate(`${y + 18}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createTimeCapsule(toId, title, content, unlockDate);
      setToId("");
      setTitle("");
      setContent("");
      setUnlockDate("");
      setUseAge18(false);
      setOpen(false);
      router.refresh();
      onAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--background)] transition-colors hover:bg-[var(--accent-muted)]"
      >
        + Write a letter
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">
        Write a letter for the future
      </h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Pick who it&apos;s for and when they can open it.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            For
          </label>
          <select
            value={toId}
            onChange={(e) => handleRecipientChange(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Select family member...</option>
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
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Read this when you turn 18"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="age18"
            checked={useAge18}
            onChange={handleAge18Toggle}
            disabled={!toId || !members.find((m) => m.id === toId)?.birth_date}
            className="rounded border-[var(--border)]"
          />
          <label htmlFor="age18" className="text-sm text-[var(--muted)]">
            Unlock when they turn 18
            {toId && !members.find((m) => m.id === toId)?.birth_date && (
              <span className="ml-1 text-[var(--muted)]/70">(add birth date on Members)</span>
            )}
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Unlock date
          </label>
          <input
            type="date"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Your letter
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={8}
            placeholder="Write what you want them to read..."
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-400">{error}</p>
      )}

      <div className="mt-6 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50"
        >
          {loading ? "Sealing..." : "Seal letter"}
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
