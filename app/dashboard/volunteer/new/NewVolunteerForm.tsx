"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVolunteerEntry } from "../actions";

type Member = { id: string; name: string; nickname: string | null; color: string | null };
type Props = { members: Member[] };

const CAUSE_SUGGESTIONS = ["Environment", "Food Bank", "Animal Welfare", "Education", "Healthcare", "Seniors", "Youth", "Homeless", "Arts", "Sport & Recreation", "Faith", "Disaster Relief"];

export function NewVolunteerForm({ members }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
  const [customCause, setCustomCause] = useState("");
  const [error, setError] = useState("");

  function toggleMember(id: string) {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  }

  function toggleCause(cause: string) {
    setSelectedCauses(prev => prev.includes(cause) ? prev.filter(c => c !== cause) : [...prev, cause]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const allCauses = [...selectedCauses, ...(customCause.trim() ? [customCause.trim()] : [])];
    fd.set("member_ids", JSON.stringify(selectedMembers));
    fd.set("cause_tags", allCauses.join(","));
    startTransition(async () => {
      const res = await createVolunteerEntry(fd);
      if (res.success) {
        router.push(`/dashboard/volunteer/${res.id}`);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Organization <span className="text-red-500">*</span></label>
        <input name="organization" type="text" autoFocus placeholder="e.g. Food Bank of Waterloo, Habitat for Humanity…" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Date <span className="text-red-500">*</span></label>
          <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Hours volunteered</label>
          <input name="hours" type="number" step="0.5" min="0" placeholder="e.g. 3.5" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">City</label>
          <input name="city" type="text" placeholder="e.g. Kitchener" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Description</label>
        <textarea name="description" rows={3} placeholder="What did you do? Who did it help?" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none" />
      </div>
      {members.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Who volunteered</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {members.map(m => (
              <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${selectedMembers.includes(m.id) ? "text-white" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]"}`}
                style={selectedMembers.includes(m.id) ? { backgroundColor: m.color ?? "var(--accent)" } : {}}
              >
                {m.nickname ?? m.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Cause</label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CAUSE_SUGGESTIONS.map(cause => (
            <button key={cause} type="button" onClick={() => toggleCause(cause)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${selectedCauses.includes(cause) ? "bg-[var(--accent)] text-white" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]"}`}
            >
              {cause}
            </button>
          ))}
        </div>
        <input type="text" value={customCause} onChange={e => setCustomCause(e.target.value)} placeholder="Or type a custom cause…" className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none" />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-[var(--accent)] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
          {isPending ? "Saving…" : "Save entry"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm text-[var(--muted)] hover:bg-[var(--surface)]">
          Cancel
        </button>
      </div>
    </form>
  );
}
