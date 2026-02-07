"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { addPerspective } from "./actions";

type Member = { id: string; name: string };

export function AddPerspectiveForm({
  storyEventId,
  existingMemberIds,
}: {
  storyEventId: string;
  existingMemberIds: string[];
}) {
  const router = useRouter();
  const { activeFamilyId } = useFamily();
  const [members, setMembers] = useState<Member[]>([]);
  const [content, setContent] = useState("");
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeFamilyId) return;
    async function fetchMembers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("family_members")
        .select("id, name")
        .eq("family_id", activeFamilyId)
        .order("name");
      if (data) setMembers((data as Member[]).filter((m) => !existingMemberIds.includes(m.id)));
    }
    fetchMembers();
  }, [activeFamilyId, existingMemberIds]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim() || !memberId) return;
    setLoading(true);
    setError(null);
    try {
      await addPerspective(storyEventId, content.trim(), memberId);
      setContent("");
      setMemberId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const availableMembers = members.filter((m) => !existingMemberIds.includes(m.id));
  if (availableMembers.length === 0) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">
        Add a perspective
      </h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Whose version? Add their take on this event.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            From *
          </label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Select family member</option>
            {availableMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Their version *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={5}
            placeholder="Their story, their angle, their memories..."
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add perspective"}
        </button>
      </div>
    </form>
  );
}
