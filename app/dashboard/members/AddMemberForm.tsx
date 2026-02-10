"use client";

import { useState } from "react";
import { addFamilyMember } from "./actions";

export function AddMemberForm() {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      await addFamilyMember(name, relationship, email, birthDate, birthPlace);
      setName("");
      setRelationship("");
      setEmail("");
      setBirthDate("");
      setBirthPlace("");
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
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
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
                className="input-base mt-1"
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
                className="input-base mt-1"
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
                className="input-base mt-1"
                placeholder="their@email.com (for login when they sign up)"
              />
            </div>
            <div className="rounded-lg border border-[var(--border)]/50 bg-[var(--background)]/30 p-4">
              <p className="text-sm font-medium text-[var(--muted)]">Birth (optional)</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="birth-date" className="block text-xs font-medium text-[var(--muted)]">Birth date</label>
                  <input
                    id="birth-date"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="input-base mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="birth-place" className="block text-xs font-medium text-[var(--muted)]">Birth place</label>
                  <input
                    id="birth-place"
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    className="input-base mt-1"
                    placeholder="e.g. Vancouver, BC"
                  />
                  <p className="mt-1 text-xs text-[var(--muted)]">Creates a balloon pin on the map</p>
                </div>
              </div>
            </div>
            {message && (
              <div className={`rounded-lg px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400 border border-red-500/30"}`} role="alert">
                {message.text}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="submit" disabled={loading} className="btn-submit order-1 rounded-lg bg-[var(--accent)] font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:order-none">
                {loading ? "Adding..." : "Add"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="min-h-[44px] rounded-lg border border-[var(--border)] px-4 py-3 text-sm hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-[44px] rounded-lg border border-[var(--accent)]/50 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          + Add member
        </button>
      )}
    </div>
  );
}
