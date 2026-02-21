"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addAchievement } from "./actions";
import { MemberSelect } from "@/app/components/MemberSelect";

type Member = { id: string; name: string };

export function AddAchievement({ members }: { members: Member[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [what, setWhat] = useState("");
  const [when, setWhen] = useState("");
  const [where, setWhere] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement)?.files?.[0];

    setLoading(true);
    try {
      await addAchievement(file ?? null, {
        familyMemberId: selectedMemberIds[0] || undefined,
        memberIds: selectedMemberIds,
        what: what.trim(),
        achievementDate: when || undefined,
        location: where.trim() || undefined,
        description: description.trim() || undefined,
      });
      setSelectedMemberIds([]);
      setWhat("");
      setWhen("");
      setWhere("");
      setDescription("");
      setOpen(false);
      router.refresh();
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {open ? (
        <form
          onSubmit={handleSubmit}
          className="sports-trophy-frame max-w-md rounded-xl border-2 border-[var(--sports-gold)] bg-white p-6 shadow-lg"
        >
          <h3 className="mb-4 font-display text-lg font-semibold text-[var(--sports-dark)]">
            Add achievement
          </h3>

          <div className="mb-3">
            <MemberSelect
              members={members}
              selectedIds={selectedMemberIds}
              onChange={setSelectedMemberIds}
              label="Who did it"
              hint="Select everyone who was part of this achievement."
            />
          </div>

          <label className="mb-1 block text-sm font-medium text-[var(--sports-dark)]">
            What was it
          </label>
          <input
            type="text"
            placeholder="e.g. OUA All Star Game, Graduation, First Marathon"
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            required
            className="mb-3 w-full rounded border border-[var(--sports-border)] bg-white px-4 py-2 text-[var(--sports-dark)] placeholder:text-[var(--sports-muted)] focus:border-[var(--sports-gold)] focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-[var(--sports-dark)]">
            When was it
          </label>
          <input
            type="date"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="mb-3 w-full rounded border border-[var(--sports-border)] bg-white px-4 py-2 text-[var(--sports-dark)] focus:border-[var(--sports-gold)] focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-[var(--sports-dark)]">
            Where was it
          </label>
          <input
            type="text"
            placeholder="e.g. Toronto, Rogers Centre"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            className="mb-3 w-full rounded border border-[var(--sports-border)] bg-white px-4 py-2 text-[var(--sports-dark)] placeholder:text-[var(--sports-muted)] focus:border-[var(--sports-gold)] focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-[var(--sports-dark)]">
            Write about it
          </label>
          <textarea
            placeholder="Tell the story..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mb-3 w-full rounded border border-[var(--sports-border)] bg-white px-4 py-2 text-[var(--sports-dark)] placeholder:text-[var(--sports-muted)] focus:border-[var(--sports-gold)] focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-[var(--sports-dark)]">
            Upload photo or document
          </label>
          <input
            name="file"
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            className="mb-4 w-full text-sm text-[var(--sports-dark)] file:mr-4 file:rounded file:border-0 file:bg-[var(--sports-gold)] file:px-4 file:py-2 file:font-semibold file:text-[var(--sports-dark)]"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-[var(--sports-gold)] px-4 py-2 font-semibold text-[var(--sports-dark)] hover:bg-[var(--sports-gold-hover)] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Add achievement"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border-2 border-[var(--sports-border)] px-4 py-2 font-medium text-[var(--sports-dark)] hover:bg-[var(--sports-cream)]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          data-add-achievement
          onClick={() => setOpen(true)}
          className="sports-pennant-btn rounded-lg border-2 border-[var(--sports-gold)] bg-[var(--sports-cream)] px-6 py-3 font-semibold text-[var(--sports-dark)] transition-colors hover:bg-[var(--sports-gold)] hover:text-[var(--sports-cream)]"
        >
          + Add achievement
        </button>
      )}
    </div>
  );
}
