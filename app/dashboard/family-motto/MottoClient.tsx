"use client";

import { useState, useTransition } from "react";
import { saveMotto, addValue, deleteValue, savePersonalNote } from "./actions";

type Value = { id: string; value: string; added_by_member_id: string | null };

type Props = {
  motto: string | null;
  values: Value[];
  currentMemberId: string | null;
  currentMemberName: string | null;
  personalNote: string | null;
  canManage: boolean;
};

export function MottoClient({ motto, values, currentMemberId, currentMemberName, personalNote, canManage }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingMotto, setEditingMotto] = useState(false);
  const [mottoText, setMottoText] = useState(motto ?? "");
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(personalNote ?? "");
  const [addingValue, setAddingValue] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [localValues, setLocalValues] = useState(values);
  const [localMotto, setLocalMotto] = useState(motto);
  const [localNote, setLocalNote] = useState(personalNote);
  const [error, setError] = useState<string | null>(null);

  function handleSaveMotto() {
    if (!mottoText.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await saveMotto(mottoText);
      if (res.success) { setLocalMotto(mottoText); setEditingMotto(false); }
      else setError(res.error ?? "Failed to save.");
    });
  }

  function handleAddValue() {
    if (!newValue.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await addValue(newValue);
      if (res.success) {
        setLocalValues((v) => [...v, { id: crypto.randomUUID(), value: newValue.trim(), added_by_member_id: currentMemberId }]);
        setNewValue("");
        setAddingValue(false);
      } else setError(res.error ?? "Failed to add.");
    });
  }

  function handleDeleteValue(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteValue(id);
      if (res.success) setLocalValues((v) => v.filter((x) => x.id !== id));
      else setError(res.error ?? "Failed to delete.");
    });
  }

  function handleSaveNote() {
    if (!currentMemberId) return;
    setError(null);
    startTransition(async () => {
      const res = await savePersonalNote(currentMemberId, noteText);
      if (res.success) { setLocalNote(noteText || null); setEditingNote(false); }
      else setError(res.error ?? "Failed to save.");
    });
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {/* Motto */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-8 text-center">
        {editingMotto ? (
          <div className="space-y-4">
            <textarea
              rows={3}
              value={mottoText}
              onChange={(e) => setMottoText(e.target.value)}
              placeholder="What does your family stand for? Write your motto..."
              className="input-base w-full resize-none text-center text-lg"
              autoFocus
            />
            <div className="flex justify-center gap-3">
              <button onClick={handleSaveMotto} disabled={isPending || !mottoText.trim()}
                className="rounded-full bg-[var(--primary)] px-6 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-60">
                {isPending ? "Saving..." : "Save"}
              </button>
              <button onClick={() => { setEditingMotto(false); setMottoText(localMotto ?? ""); }}
                className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
                Cancel
              </button>
            </div>
          </div>
        ) : localMotto ? (
          <div>
            <p className="font-display text-2xl font-bold italic text-[var(--foreground)] sm:text-3xl">
              &ldquo;{localMotto}&rdquo;
            </p>
            {canManage && (
              <button onClick={() => setEditingMotto(true)}
                className="mt-4 text-sm text-[var(--accent)] hover:underline">
                Edit motto
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-[var(--muted)]">No family motto yet.</p>
            {canManage && (
              <button onClick={() => setEditingMotto(true)}
                className="mt-3 rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90">
                + Write your motto
              </button>
            )}
          </div>
        )}
      </div>

      {/* Values */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Our Values</h2>
          <button onClick={() => setAddingValue(true)}
            className="text-sm text-[var(--accent)] hover:underline">
            + Add a value
          </button>
        </div>

        {addingValue && (
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddValue(); if (e.key === "Escape") { setAddingValue(false); setNewValue(""); } }}
              placeholder="e.g. Kindness, Grit, Show up..."
              className="input-base flex-1"
              maxLength={40}
              autoFocus
            />
            <button onClick={handleAddValue} disabled={isPending || !newValue.trim()}
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-60">
              Add
            </button>
            <button onClick={() => { setAddingValue(false); setNewValue(""); }}
              className="rounded-full border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
              Cancel
            </button>
          </div>
        )}

        {localValues.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No values added yet. What does your family stand for?</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {localValues.map((v) => (
              <span key={v.id}
                className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-sm font-medium text-[var(--foreground)]">
                {v.value}
                <button onClick={() => handleDeleteValue(v.id)} disabled={isPending}
                  className="ml-0.5 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Personal note for current member */}
      {currentMemberId && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">
                What this means to {currentMemberName ?? "you"}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--muted)]">
                Your personal take. Shows on your profile.
              </p>
            </div>
            {!editingNote && (
              <button onClick={() => setEditingNote(true)}
                className="text-sm text-[var(--accent)] hover:underline">
                {localNote ? "Edit" : "+ Add your take"}
              </button>
            )}
          </div>

          {editingNote ? (
            <div className="space-y-3">
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="What do these values mean to you personally?"
                className="input-base w-full resize-y"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={handleSaveNote} disabled={isPending}
                  className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-60">
                  {isPending ? "Saving..." : "Save"}
                </button>
                <button onClick={() => { setEditingNote(false); setNoteText(localNote ?? ""); }}
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
                  Cancel
                </button>
              </div>
            </div>
          ) : localNote ? (
            <p className="text-[var(--foreground)]">{localNote}</p>
          ) : (
            <p className="text-sm text-[var(--muted)]">Nothing added yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
