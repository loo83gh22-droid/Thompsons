"use client";

import { useState } from "react";
import { updateFamilyMember, deleteFamilyMember } from "./actions";

type Member = {
  id: string;
  name: string;
  relationship: string | null;
  contact_email: string | null;
  user_id: string | null;
  birth_date: string | null;
  birth_place: string | null;
};

export function MemberList({ members }: { members: Member[] }) {
  return (
    <div className="space-y-3">
      {members.map((m) => (
        <MemberRow key={m.id} member={m} />
      ))}
    </div>
  );
}

function MemberRow({ member }: { member: Member }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(member.name);
  const [relationship, setRelationship] = useState(member.relationship ?? "");
  const [email, setEmail] = useState(member.contact_email ?? "");
  const [birthDate, setBirthDate] = useState(member.birth_date ?? "");
  const [birthPlace, setBirthPlace] = useState(member.birth_place ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      await updateFamilyMember(member.id, name, relationship, email, birthDate, birthPlace);
      setMessage({ type: "success", text: "Updated." });
      setEditing(false);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (!confirm(`Remove ${member.name} from the family?`)) return;
    setLoading(true);
    try {
      await deleteFamilyMember(member.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <form
        onSubmit={handleUpdate}
        className="rounded-xl border border-[var(--accent)]/50 bg-[var(--surface)] p-6"
      >
        <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">Edit member</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor={`name-${member.id}`} className="block text-sm font-medium text-[var(--muted)]">Name</label>
            <input
              id={`name-${member.id}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
              placeholder="e.g. Sarah"
            />
          </div>
          <div>
            <label htmlFor={`relationship-${member.id}`} className="block text-sm font-medium text-[var(--muted)]">Relationship</label>
            <input
              id={`relationship-${member.id}`}
              type="text"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
              placeholder="e.g. Mom, Dad, Child"
            />
          </div>
          <div>
            <label htmlFor={`email-${member.id}`} className="block text-sm font-medium text-[var(--muted)]">Email</label>
            <input
              id={`email-${member.id}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
              placeholder="their@email.com"
            />
          </div>
          <div className="rounded-lg border border-[var(--border)]/50 bg-[var(--background)]/30 p-4">
            <p className="text-sm font-medium text-[var(--muted)]">Birth</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`birth-date-${member.id}`} className="block text-xs font-medium text-[var(--muted)]">Birth date</label>
                <input
                  id={`birth-date-${member.id}`}
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor={`birth-place-${member.id}`} className="block text-xs font-medium text-[var(--muted)]">Birth place</label>
                <input
                  id={`birth-place-${member.id}`}
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                  placeholder="e.g. Vancouver, BC"
                />
                <p className="mt-1 text-xs text-[var(--muted)]">Creates a balloon pin on the map</p>
              </div>
            </div>
          </div>
          {message && (
            <div className={`rounded-lg px-4 py-2 text-sm ${message.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
              {message.text}
            </div>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50">
              {loading ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} disabled={loading} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-hover)] disabled:opacity-50">
              Cancel
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-4">
      <div>
        <p className="font-medium text-[var(--foreground)]">{member.name}</p>
        <div className="mt-1 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
          {member.relationship && <span>{member.relationship}</span>}
          {member.birth_date && <span>Born {new Date(member.birth_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
          {member.birth_place && <span>{member.birth_place}</span>}
          {member.contact_email && <span>{member.contact_email}</span>}
          {member.user_id ? (
            <span className="text-emerald-500/80">Signed in</span>
          ) : (
            <span className="text-amber-500/80">Pending</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={loading}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleRemove}
          disabled={loading}
          className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
