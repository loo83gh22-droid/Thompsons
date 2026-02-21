"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { createTimeCapsule } from "./actions";
import { MemberSelect } from "@/app/components/MemberSelect";

type Member = { id: string; name: string; birth_date: string | null };

export function AddTimeCapsuleForm({ onAdded }: { onAdded?: () => void }) {
  const router = useRouter();
  const { activeFamilyId } = useFamily();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [useAge18, setUseAge18] = useState(false);
  const [unlockOnPassing, setUnlockOnPassing] = useState(false);

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

  function handleRecipientChange(ids: string[]) {
    setSelectedRecipientIds(ids);
    // Auto-set unlock date for the first selected member if useAge18 is on
    if (ids.length > 0) {
      const member = members.find((m) => m.id === ids[0]);
      if (member?.birth_date && useAge18) {
        const [y, m, d] = member.birth_date.split("-").map(Number);
        setUnlockDate(`${y + 18}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
      }
    }
  }

  function handleAge18Toggle() {
    setUseAge18((prev) => !prev);
    if (!useAge18 && selectedRecipientIds.length > 0) {
      const member = members.find((m) => m.id === selectedRecipientIds[0]);
      if (member?.birth_date) {
        const [y, m, d] = member.birth_date.split("-").map(Number);
        setUnlockDate(`${y + 18}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!unlockDate && !unlockOnPassing) {
      setError("Please set an unlock date or choose to unlock when you pass.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // If unlock_on_passing is set without a date, use a far-future date as fallback
      const effectiveDate = unlockDate || "2999-12-31";
      await createTimeCapsule(
        selectedRecipientIds[0],
        title,
        content,
        effectiveDate,
        selectedRecipientIds,
        unlockOnPassing
      );
      setSelectedRecipientIds([]);
      setTitle("");
      setContent("");
      setUnlockDate("");
      setUseAge18(false);
      setUnlockOnPassing(false);
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
        data-time-capsule-add
        onClick={() => setOpen(true)}
        className="rounded-full bg-[var(--primary)] px-4 py-2 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
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
        Pick who it&apos;s for and when they can open it. Letters are private — only you and the recipients can read them.
      </p>

      <div className="mt-6 space-y-4">
        <MemberSelect
          members={members}
          selectedIds={selectedRecipientIds}
          onChange={handleRecipientChange}
          label="For"
          hint="Select who this letter is for. Only they will be able to read it."
          required
        />

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

        {/* Unlock timing options */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--muted)]">
            When should it unlock?
          </label>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="age18"
              checked={useAge18}
              onChange={handleAge18Toggle}
              disabled={selectedRecipientIds.length === 0 || !members.find((m) => m.id === selectedRecipientIds[0])?.birth_date}
              className="rounded border-[var(--border)]"
            />
            <label htmlFor="age18" className="text-sm text-[var(--muted)]">
              When they turn 18
              {selectedRecipientIds.length > 0 && !members.find((m) => m.id === selectedRecipientIds[0])?.birth_date && (
                <span className="ml-1 text-[var(--muted)]/70">(add birth date on Members)</span>
              )}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="unlockOnPassing"
              checked={unlockOnPassing}
              onChange={() => setUnlockOnPassing((prev) => !prev)}
              className="rounded border-[var(--border)]"
            />
            <label htmlFor="unlockOnPassing" className="text-sm text-[var(--muted)]">
              🕊️ Unlock when I pass away
            </label>
          </div>

          {unlockOnPassing && (
            <p className="ml-6 text-xs text-[var(--muted)] italic">
              This letter will stay sealed until the family owner marks you as passed. You can also set a date below as an alternative unlock.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            {unlockOnPassing ? "Unlock date (optional backup)" : "Unlock date"}
          </label>
          <input
            type="date"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            required={!unlockOnPassing}
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

      {/* Privacy notice */}
      <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
        <p className="text-xs text-amber-800">
          🔒 <strong>Private letter.</strong> Only you (the sender) and the selected recipients can read this letter. Other family members will see that a letter exists but cannot access its contents.
        </p>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-6 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[var(--primary)] px-4 py-2 font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
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
