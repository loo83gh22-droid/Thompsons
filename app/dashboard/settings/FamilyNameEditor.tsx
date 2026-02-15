"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FamilyNameEditor({
  familyId,
  currentName,
}: {
  familyId: string;
  currentName: string;
}) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isDirty = name.trim() !== currentName;

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Family name cannot be empty");
      return;
    }
    if (!isDirty) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/family-name", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor="family-name"
          className="text-sm font-medium text-[var(--foreground)]"
        >
          Family Name
        </label>
        <span className="text-xs text-[var(--muted)]">
          Appears in the header as &ldquo;{name.trim() || "..."} Nest&rdquo;
        </span>
      </div>

      <div className="flex gap-3">
        <input
          id="family-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
            setSuccess(false);
          }}
          placeholder="e.g. Thompson"
          maxLength={50}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="shrink-0 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      {success && (
        <p className="text-xs text-green-600">
          Family name updated! The header will reflect the change.
        </p>
      )}
    </div>
  );
}
