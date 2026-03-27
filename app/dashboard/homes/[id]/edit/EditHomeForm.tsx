"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateHome } from "../../actions";

type Member = { id: string; name: string; nickname: string | null; color: string | null };
type Props = {
  homeId: string;
  home: { address: string | null; city: string | null; from_year: number | null; to_year: number | null; notes: string | null };
  members: Member[];
  existingMemberIds: string[];
};

export function EditHomeForm({ homeId, home, members, existingMemberIds }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedMembers, setSelectedMembers] = useState<string[]>(existingMemberIds);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);

  function toggleMember(id: string) {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("member_ids", JSON.stringify(selectedMembers));
    startTransition(async () => {
      const res = await updateHome(homeId, fd);
      if (res.success) {
        router.push(`/dashboard/homes/${homeId}`);
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Street address</label>
        <input name="address" type="text" defaultValue={home.address ?? ""} className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">City / Town</label>
        <input name="city" type="text" defaultValue={home.city ?? ""} className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Moved in (year)</label>
          <select name="from_year" defaultValue={home.from_year?.toString() ?? ""} className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none">
            <option value="">-- Unknown --</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Moved out (year)</label>
          <select name="to_year" defaultValue={home.to_year?.toString() ?? ""} className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none">
            <option value="">Current home</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      {members.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Who lived here</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {members.map(m => (
              <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${selectedMembers.includes(m.id) ? "text-white" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]"}`}
                style={selectedMembers.includes(m.id) ? { backgroundColor: m.color ?? "var(--accent)" } : {}}
              >
                {m.nickname ?? m.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Notes / memories</label>
        <textarea name="notes" rows={4} defaultValue={home.notes ?? ""} className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none" />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-[var(--accent)] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm text-[var(--muted)] hover:bg-[var(--surface)]">
          Cancel
        </button>
      </div>
    </form>
  );
}
