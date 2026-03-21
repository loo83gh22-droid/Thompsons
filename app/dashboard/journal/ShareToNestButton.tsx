"use client";

import { useState } from "react";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { shareJournalEntryToFamily } from "./actions";

interface ShareToNestButtonProps {
  entryId: string;
  entryTitle: string;
}

export function ShareToNestButton({ entryId, entryTitle }: ShareToNestButtonProps) {
  const { families, activeFamilyId } = useFamily();
  const otherFamilies = families.filter((f) => f.id !== activeFamilyId);

  const [open, setOpen] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Only show when user belongs to more than one family
  if (otherFamilies.length === 0) return null;

  function openModal() {
    setSelectedFamilyId(otherFamilies[0]?.id ?? "");
    setResult(null);
    setErrorMsg("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setResult(null);
    setLoading(false);
  }

  async function handleShare() {
    if (!selectedFamilyId) return;
    setLoading(true);
    setResult(null);
    const res = await shareJournalEntryToFamily(entryId, selectedFamilyId);
    setLoading(false);
    if (res.success) {
      setResult("success");
    } else {
      setResult("error");
      setErrorMsg(res.error ?? "Something went wrong.");
    }
  }

  const selectedFamilyName = families.find((f) => f.id === selectedFamilyId)?.name ?? "";

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openModal}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors"
        title="Share to another Nest"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Share to Nest
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-[var(--background)] p-6 shadow-xl">

            {result === "success" ? (
              /* Success state */
              <div className="text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Shared!</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  <strong>{entryTitle || "This entry"}</strong> has been copied to{" "}
                  <strong className="text-[var(--accent)]">{selectedFamilyName}&apos;s Nest</strong>.
                </p>
                <button
                  onClick={closeModal}
                  className="mt-5 w-full rounded-full bg-[var(--primary)] py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Picker state */
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Share to another Nest</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Copy this entry and its photos to a different Nest you belong to.
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="ml-4 shrink-0 text-[var(--muted)] hover:text-[var(--foreground)]"
                    aria-label="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)] mb-2">Choose a Nest</p>
                  <div className="space-y-2">
                    {otherFamilies.map((family) => (
                      <label
                        key={family.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
                          selectedFamilyId === family.id
                            ? "border-[var(--accent)] bg-[var(--accent)]/8"
                            : "border-[var(--border)] hover:border-[var(--accent)]/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="targetFamily"
                          value={family.id}
                          checked={selectedFamilyId === family.id}
                          onChange={() => setSelectedFamilyId(family.id)}
                          className="accent-[var(--accent)]"
                        />
                        <span className="font-medium text-[var(--foreground)]">{family.name}&apos;s Nest</span>
                      </label>
                    ))}
                  </div>
                </div>

                {result === "error" && (
                  <div className="mt-4 rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
                    {errorMsg}
                  </div>
                )}

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 rounded-full border border-[var(--border)] py-2.5 text-sm font-medium hover:bg-[var(--surface-hover)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={loading || !selectedFamilyId}
                    className="flex-1 rounded-full bg-[var(--primary)] py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "Sharing…" : "Share"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
