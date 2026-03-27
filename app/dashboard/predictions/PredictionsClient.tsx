"use client";

import { useState, useTransition } from "react";
import { createPrediction, addPredictionEntry, deletePrediction, resolveOutcome } from "./actions";

type Member = { id: string; name: string; nickname: string | null; color: string | null };

type Entry = {
  id: string;
  member_id: string | null;
  prediction: string;
  is_correct: boolean | null;
  member?: Member | null;
};

type Prediction = {
  id: string;
  topic: string;
  target_date: string | null;
  outcome: string | null;
  resolved_at: string | null;
  created_at: string;
  entries: Entry[];
};

type Props = {
  predictions: Prediction[];
  members: Member[];
  myMemberId: string | null;
  myRole: string;
};

export function PredictionsClient({ predictions: initial, members, myMemberId, myRole }: Props) {
  const [predictions, setPredictions] = useState(initial);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newDate, setNewDate] = useState("");
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Per-prediction state: entryText[predId], entryMember[predId], resolveMode[predId]
  const [entryText, setEntryText] = useState<Record<string, string>>({});
  const [entryMember, setEntryMember] = useState<Record<string, string>>({});
  const [showEntryForm, setShowEntryForm] = useState<Record<string, boolean>>({});
  const [resolveMode, setResolveMode] = useState<Record<string, boolean>>({});
  const [outcomeText, setOutcomeText] = useState<Record<string, string>>({});
  const [correctIds, setCorrectIds] = useState<Record<string, string[]>>({});

  function memberDisplay(m: Member) {
    return m.nickname ? `${m.name} (${m.nickname})` : m.name;
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTopic.trim()) { setFormError("Topic is required."); return; }
    startTransition(async () => {
      const res = await createPrediction(newTopic, newDate);
      if (res.success) {
        setPredictions([{
          id: res.id!,
          topic: newTopic.trim(),
          target_date: newDate || null,
          outcome: null,
          resolved_at: null,
          created_at: new Date().toISOString(),
          entries: [],
        }, ...predictions]);
        setNewTopic(""); setNewDate(""); setFormError(""); setShowNewForm(false);
      } else {
        setFormError(res.error ?? "Something went wrong.");
      }
    });
  }

  function handleAddEntry(predId: string) {
    const text = entryText[predId] ?? "";
    const memberId = entryMember[predId] ?? "";
    if (!text.trim()) return;
    startTransition(async () => {
      const res = await addPredictionEntry(predId, memberId, text);
      if (res.success) {
        const member = members.find(m => m.id === memberId) ?? null;
        setPredictions(predictions.map(p => p.id !== predId ? p : {
          ...p,
          entries: [...p.entries, {
            id: res.id!,
            member_id: memberId || null,
            prediction: text.trim(),
            is_correct: null,
            member,
          }],
        }));
        setEntryText({ ...entryText, [predId]: "" });
        setShowEntryForm({ ...showEntryForm, [predId]: false });
      }
    });
  }

  function handleResolve(predId: string) {
    const outcome = outcomeText[predId] ?? "";
    if (!outcome.trim()) return;
    startTransition(async () => {
      const res = await resolveOutcome(predId, outcome, correctIds[predId] ?? []);
      if (res.success) {
        setPredictions(predictions.map(p => p.id !== predId ? p : {
          ...p,
          outcome: outcome.trim(),
          resolved_at: new Date().toISOString(),
          entries: p.entries.map(e => ({
            ...e,
            is_correct: (correctIds[predId] ?? []).includes(e.id) ? true : false,
          })),
        }));
        setResolveMode({ ...resolveMode, [predId]: false });
      }
    });
  }

  function handleDelete(predId: string) {
    startTransition(async () => {
      const res = await deletePrediction(predId);
      if (res.success) setPredictions(predictions.filter(p => p.id !== predId));
    });
  }

  function toggleCorrect(predId: string, entryId: string) {
    const current = correctIds[predId] ?? [];
    setCorrectIds({
      ...correctIds,
      [predId]: current.includes(entryId)
        ? current.filter(id => id !== entryId)
        : [...current, entryId],
    });
  }

  const canManage = myRole === "owner" || myRole === "adult";

  return (
    <div className="mt-8">
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + New prediction
        </button>
      </div>

      {/* New prediction form */}
      {showNewForm && (
        <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">New prediction topic</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">
                What are we predicting? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newTopic}
                onChange={e => setNewTopic(e.target.value)}
                autoFocus
                placeholder="e.g. Who will win the Stanley Cup? Where will we be living in 5 years?"
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Target date (when we find out)</label>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {isPending ? "Saving…" : "Create prediction"}
              </button>
              <button type="button" onClick={() => { setShowNewForm(false); setFormError(""); }} className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)]">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {predictions.length === 0 && (
        <div className="mt-20 text-center">
          <div className="text-5xl">🔮</div>
          <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">No predictions yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-sm mx-auto">
            Create a topic, then each family member adds their own prediction. Come back when the answer is known!
          </p>
        </div>
      )}

      {/* Predictions list */}
      <div className="space-y-6">
        {predictions.map(pred => (
          <div key={pred.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">{pred.topic}</h2>
                  {pred.resolved_at && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Resolved
                    </span>
                  )}
                </div>
                {pred.target_date && (
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    Target: {new Date(pred.target_date).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                )}
              </div>
              {canManage && (
                <button
                  onClick={() => handleDelete(pred.id)}
                  disabled={isPending}
                  className="ml-4 rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-red-500"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            {/* Outcome */}
            {pred.outcome && (
              <div className="mx-6 mb-4 rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">What actually happened</p>
                <p className="mt-1 text-sm text-[var(--foreground)]">{pred.outcome}</p>
              </div>
            )}

            {/* Entries */}
            <div className="space-y-3 px-6 pb-4">
              {pred.entries.map(entry => {
                const m = entry.member;
                return (
                  <div key={entry.id} className={`flex items-start gap-3 rounded-xl p-3 ${entry.is_correct === true ? "bg-green-50 dark:bg-green-900/20" : entry.is_correct === false ? "bg-[var(--surface)] opacity-60" : "bg-[var(--surface)]"}`}>
                    {m && (
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: m.color ?? "var(--accent)" }}
                      >
                        {(m.nickname ?? m.name).charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      {m && <p className="text-xs font-medium text-[var(--muted)]">{m.nickname ?? m.name}</p>}
                      <p className="text-sm text-[var(--foreground)]">{entry.prediction}</p>
                    </div>
                    {entry.is_correct === true && <span className="text-lg">✅</span>}
                    {resolveMode[pred.id] && (
                      <button
                        type="button"
                        onClick={() => toggleCorrect(pred.id, entry.id)}
                        className={`shrink-0 rounded-lg px-2 py-1 text-xs font-medium ${(correctIds[pred.id] ?? []).includes(entry.id) ? "bg-green-500 text-white" : "bg-[var(--border)] text-[var(--muted)]"}`}
                      >
                        {(correctIds[pred.id] ?? []).includes(entry.id) ? "Correct ✓" : "Mark correct"}
                      </button>
                    )}
                  </div>
                );
              })}

              {pred.entries.length === 0 && !pred.resolved_at && (
                <p className="text-sm text-[var(--muted)] italic">No predictions yet — be the first!</p>
              )}
            </div>

            {/* Add entry / resolve */}
            <div className="border-t border-[var(--border)] p-4">
              {!pred.resolved_at && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowEntryForm({ ...showEntryForm, [pred.id]: !showEntryForm[pred.id] })}
                    className="rounded-lg bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--border)]"
                  >
                    + Add my prediction
                  </button>
                  {canManage && !resolveMode[pred.id] && (
                    <button
                      onClick={() => setResolveMode({ ...resolveMode, [pred.id]: true })}
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)]"
                    >
                      Reveal outcome
                    </button>
                  )}
                </div>
              )}

              {showEntryForm[pred.id] && (
                <div className="mt-3 flex gap-2">
                  <select
                    value={entryMember[pred.id] ?? (myMemberId ?? "")}
                    onChange={e => setEntryMember({ ...entryMember, [pred.id]: e.target.value })}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option value="">Me</option>
                    {members.map(m => <option key={m.id} value={m.id}>{memberDisplay(m)}</option>)}
                  </select>
                  <input
                    type="text"
                    value={entryText[pred.id] ?? ""}
                    onChange={e => setEntryText({ ...entryText, [pred.id]: e.target.value })}
                    placeholder="My prediction…"
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                    onKeyDown={e => e.key === "Enter" && handleAddEntry(pred.id)}
                  />
                  <button
                    onClick={() => handleAddEntry(pred.id)}
                    disabled={isPending}
                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              )}

              {resolveMode[pred.id] && (
                <div className="mt-3 space-y-3">
                  <p className="text-sm font-medium text-[var(--foreground)]">What actually happened?</p>
                  <textarea
                    rows={2}
                    value={outcomeText[pred.id] ?? ""}
                    onChange={e => setOutcomeText({ ...outcomeText, [pred.id]: e.target.value })}
                    placeholder="Describe the actual outcome…"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                  <p className="text-xs text-[var(--muted)]">Tap "Mark correct" above next to each entry that got it right, then save.</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleResolve(pred.id)} disabled={isPending} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                      Save outcome
                    </button>
                    <button onClick={() => { setResolveMode({ ...resolveMode, [pred.id]: false }); setCorrectIds({ ...correctIds, [pred.id]: [] }); }} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface)]">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
