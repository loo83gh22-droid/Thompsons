"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type NestKeeper = {
  id: string;
  family_id: string;
  designated_by: string | null;
  email: string;
  name: string | null;
  relationship: string | null;
  priority: number;
  status: string;
  created_at: string;
  notified_at: string | null;
};

type FormData = {
  name: string;
  email: string;
  relationship: string;
};

const EMPTY_FORM: FormData = { name: "", email: "", relationship: "" };

const RELATIONSHIP_SUGGESTIONS = [
  "Daughter",
  "Son",
  "Niece",
  "Nephew",
  "Sibling",
  "Grandchild",
  "Cousin",
  "Spouse",
  "Friend",
];

export default function NestKeepersPage() {
  const [keepers, setKeepers] = useState<NestKeeper[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const fetchKeepers = useCallback(async () => {
    try {
      const res = await fetch("/api/nest-keepers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setKeepers(data.keepers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Nest Keepers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeepers();
  }, [fetchKeepers]);

  // Clear messages after 4 seconds
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        // Update
        const res = await fetch("/api/nest-keepers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...form }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update");
        setSuccess("Nest Keeper updated");
      } else {
        // Create
        const res = await fetch("/api/nest-keepers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add");
        setSuccess("Nest Keeper added");
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
      await fetchKeepers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this Nest Keeper?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/nest-keepers?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove");
      setSuccess("Nest Keeper removed");
      await fetchKeepers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    }
  }

  async function handleMovePriority(id: string, direction: "up" | "down") {
    const keeper = keepers.find((k) => k.id === id);
    if (!keeper) return;
    const newPriority =
      direction === "up" ? keeper.priority - 1 : keeper.priority + 1;
    if (newPriority < 1 || newPriority > 3) return;

    setError(null);
    try {
      const res = await fetch("/api/nest-keepers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, priority: newPriority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reorder");
      await fetchKeepers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder");
    }
  }

  function startEdit(keeper: NestKeeper) {
    setEditingId(keeper.id);
    setForm({
      name: keeper.name ?? "",
      email: keeper.email,
      relationship: keeper.relationship ?? "",
    });
    setShowForm(true);
  }

  function cancelForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  const priorityLabel = (p: number) => {
    if (p === 1) return "1st";
    if (p === 2) return "2nd";
    return "3rd";
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="rounded-full bg-green-900/40 px-2 py-0.5 text-xs text-green-400">
            Active
          </span>
        );
      case "notified":
        return (
          <span className="rounded-full bg-yellow-900/40 px-2 py-0.5 text-xs text-yellow-400">
            Notified
          </span>
        );
      case "claimed":
        return (
          <span className="rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-xs text-[var(--accent)]">
            Claimed
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-[var(--muted)]">
        Loading Nest Keepers...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold">Nest Keepers</h1>
        <p className="mt-1 text-[var(--muted)]">
          Designate up to 3 trusted people to inherit your Family Nest
        </p>
      </div>

      {/* Explanation card */}
      <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-2xl" aria-hidden="true">
            🛡️
          </span>
          <div className="space-y-2 text-sm text-[var(--foreground)]/80">
            <p className="font-medium text-[var(--foreground)]">
              How Nest Keeper succession works
            </p>
            <p>
              If no one in your family logs in for <strong>12 months</strong>,
              your first Nest Keeper will be notified by email and given the
              option to claim ownership of your Family Nest.
            </p>
            <p>
              If they don&apos;t respond within <strong>30 days</strong>, the
              next Nest Keeper in line is contacted, and so on.
            </p>
            <p className="text-[var(--muted)]">
              This ensures your family&apos;s memories are never lost, even if
              circumstances change.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-900/20 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {/* Keepers list */}
      {keepers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Your Nest Keepers ({keepers.length}/3)
          </h2>
          {keepers.map((keeper) => (
            <div
              key={keeper.id}
              className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]/30"
            >
              {/* Priority badge */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMovePriority(keeper.id, "up")}
                  disabled={keeper.priority === 1}
                  className="rounded p-1 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--muted)]"
                  aria-label="Move up in priority"
                >
                  ▲
                </button>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/20 text-sm font-bold text-[var(--accent)]">
                  {priorityLabel(keeper.priority)}
                </span>
                <button
                  type="button"
                  onClick={() => handleMovePriority(keeper.id, "down")}
                  disabled={
                    keeper.priority >= keepers.length || keeper.priority === 3
                  }
                  className="rounded p-1 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--muted)]"
                  aria-label="Move down in priority"
                >
                  ▼
                </button>
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-[var(--foreground)]">
                    {keeper.name || "Unnamed"}
                  </p>
                  {statusBadge(keeper.status)}
                </div>
                <p className="truncate text-sm text-[var(--muted)]">
                  {keeper.email}
                </p>
                {keeper.relationship && (
                  <p className="text-xs text-[var(--muted)]">
                    {keeper.relationship}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => startEdit(keeper)}
                  className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(keeper.id)}
                  className="rounded-lg px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/20"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {keepers.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-lg font-medium text-[var(--foreground)]">
            No Nest Keepers designated yet
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add someone you trust to ensure your family&apos;s memories are
            preserved.
          </p>
        </div>
      )}

      {/* Add / Edit form */}
      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          <h3 className="font-semibold text-[var(--foreground)]">
            {editingId ? "Edit Nest Keeper" : "Add Nest Keeper"}
          </h3>

          <div>
            <label
              htmlFor="nk-name"
              className="mb-1 block text-sm font-medium text-[var(--foreground)]"
            >
              Name
            </label>
            <input
              id="nk-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Sarah Thompson"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div>
            <label
              htmlFor="nk-email"
              className="mb-1 block text-sm font-medium text-[var(--foreground)]"
            >
              Email <span className="text-red-400">*</span>
            </label>
            <input
              id="nk-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. sarah@example.com"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div>
            <label
              htmlFor="nk-relationship"
              className="mb-1 block text-sm font-medium text-[var(--foreground)]"
            >
              Relationship
            </label>
            <input
              id="nk-relationship"
              type="text"
              value={form.relationship}
              onChange={(e) =>
                setForm({ ...form, relationship: e.target.value })
              }
              placeholder="e.g. Daughter"
              list="relationship-suggestions"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <datalist id="relationship-suggestions">
              {RELATIONSHIP_SUGGESTIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--background)] transition-colors hover:bg-[var(--accent)]/90 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Keeper"
                  : "Add Keeper"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-lg px-4 py-2.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        keepers.length < 3 && (
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--accent)]/40 bg-[var(--accent)]/5 px-4 py-3 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
          >
            <span className="text-lg">+</span> Add Nest Keeper
          </button>
        )
      )}

      {/* Legacy plan note */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center text-sm text-[var(--muted)]">
        <p>
          Nest Keeper designation is available with the{" "}
          <Link
            href="/pricing"
            className="font-medium text-[var(--accent)] hover:underline"
          >
            Legacy Plan
          </Link>
          .
        </p>
        <p className="mt-1">
          Your designees will only be contacted after 12 months of inactivity.
        </p>
      </div>
    </div>
  );
}
