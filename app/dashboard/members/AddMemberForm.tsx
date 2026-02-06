"use client";

import { useState } from "react";
import { addFamilyMember } from "./actions";

export function AddMemberForm() {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      await addFamilyMember(name, relationship, email);
      setName("");
      setRelationship("");
      setEmail("");
      setMessage({ type: "success", text: "Member added. Add another or close." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {open ? (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">Add a member</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--muted)]">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                placeholder="e.g. Sarah"
              />
            </div>
            <div>
              <label htmlFor="relationship" className="block text-sm font-medium text-[var(--muted)]">Relationship</label>
              <input
                id="relationship"
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                placeholder="e.g. Mom, Dad, Child"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--muted)]">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                placeholder="their@email.com (for login when they sign up)"
              />
            </div>
            {message && (
              <div className={`rounded-lg px-4 py-2 text-sm ${message.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                {message.text}
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50">
                {loading ? "Adding..." : "Add"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-hover)]">
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-[var(--accent)]/50 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10"
        >
          + Add member
        </button>
      )}
    </div>
  );
}
