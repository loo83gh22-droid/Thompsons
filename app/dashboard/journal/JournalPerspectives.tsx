"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { addJournalPerspective, removeJournalPerspective } from "./actions";

type Member = { id: string; name: string };
type Perspective = {
  id: string;
  content: string;
  family_member_id: string;
  family_members: { name: string } | { name: string }[] | null;
};

export function JournalPerspectives({
  entryId,
}: {
  entryId: string;
}) {
  const router = useRouter();
  const { activeFamilyId } = useFamily();
  const [members, setMembers] = useState<Member[]>([]);
  const [perspectives, setPerspectives] = useState<Perspective[]>([]);
  const [loadingPerspectives, setLoadingPerspectives] = useState(true);
  const [content, setContent] = useState("");
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!entryId) return;
    async function fetchPerspectives() {
      const supabase = createClient();
      const { data } = await supabase
        .from("journal_perspectives")
        .select("id, content, family_member_id, family_members!family_member_id(name)")
        .eq("journal_entry_id", entryId)
        .order("created_at");
      if (data) setPerspectives(data as unknown as Perspective[]);
      setLoadingPerspectives(false);
    }
    fetchPerspectives();
  }, [entryId]);

  const existingMemberIds = perspectives.map((p) => p.family_member_id);
  const availableMembers = members.filter((m) => !existingMemberIds.includes(m.id));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim() || !memberId) return;
    setLoading(true);
    setError(null);
    try {
      await addJournalPerspective(entryId, content.trim(), memberId);
      const supabase = createClient();
      const { data } = await supabase
        .from("journal_perspectives")
        .select("id, content, family_member_id, family_members!family_member_id(name)")
        .eq("journal_entry_id", entryId)
        .order("created_at");
      if (data) setPerspectives(data as unknown as Perspective[]);
      setContent("");
      setMemberId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this perspective?")) return;
    setDeletingId(id);
    try {
      await removeJournalPerspective(id, entryId);
      setPerspectives((p) => p.filter((x) => x.id !== id));
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (loadingPerspectives) return null;

  return (
    <div className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
        Other perspectives
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Dad&apos;s version vs. the kids&apos; version — add different angles on the same memory.
      </p>

      {perspectives.length > 0 && (
        <div className="mt-6 space-y-4">
          {perspectives.map((p) => {
            const name = Array.isArray(p.family_members) ? p.family_members[0]?.name : p.family_members?.name;
            return (
              <div
                key={p.id}
                className="rounded-lg border-l-4 border-[var(--accent)]/50 bg-[var(--background)] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--muted)]">
                      {name}&apos;s version
                    </p>
                    <div className="mt-2 whitespace-pre-wrap text-[var(--foreground)]">
                      {p.content}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(p.id)}
                    disabled={deletingId === p.id}
                    className="flex-shrink-0 rounded text-sm text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingId === p.id ? "..." : "Remove"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {availableMembers.length > 0 && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Add a perspective from
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
              Their version
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              placeholder="Their story, their angle, their memories..."
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-[var(--primary)] px-4 py-2 font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add perspective"}
          </button>
        </form>
      )}

      {availableMembers.length === 0 && perspectives.length === 0 && (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Add family members to invite their perspectives.
        </p>
      )}
      {availableMembers.length === 0 && perspectives.length > 0 && (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Everyone has added their perspective.
        </p>
      )}
    </div>
  );
}
