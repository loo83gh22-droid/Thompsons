"use client";

import { useState, useTransition } from "react";
import { giveAward, deleteAward } from "./actions";

type Member = { id: string; name: string; nickname: string | null; color: string | null };

type Award = {
  id: string;
  award_name: string;
  recipient_id: string | null;
  year: number;
  description: string | null;
  is_roast: boolean;
  given_by: string | null;
  recipient?: Member | null;
  givenByMember?: Member | null;
};

type Props = {
  awards: Award[];
  members: Member[];
  myMemberId: string | null;
  myRole: string;
  currentYear: number;
  daysSinceLastAward: number | null;
};

const SUGGESTED_AWARDS = [
  "Most Likely to Still Be Asleep at Noon",
  "Best Excuse for Not Doing Dishes",
  "Most Dramatic Response to a Minor Inconvenience",
  "Unofficial Family DJ (No One Asked)",
  "World's Okayest Chef",
  "Most Tabs Open at Once",
  "Loudest Yawn in a Quiet Room",
  "Most Generous with Other People's Leftovers",
  "Best Selective Hearing",
  "Took the Longest to Figure Out the TV Remote",
  "Most Likely to Lose Their Phone (It's in Their Hand)",
  "Best Bedtime Negotiator",
  "Snack Disappearance Award",
  "Most Likely to Reply 'I'm 5 Minutes Away' from 30 Minutes Away",
  "Finder of Things That Were 'Right There'",
  "Most Committed to a Dad Joke",
  "Best at Pretending to Listen",
  "Most Improved at Actually Replacing the Toilet Roll",
];

export function AwardsNightClient({ awards: initial, members, myMemberId, myRole, currentYear, daysSinceLastAward }: Props) {
  const [awards, setAwards] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [awardName, setAwardName] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [year, setYear] = useState(currentYear);
  const [description, setDescription] = useState("");
  const [isRoast, setIsRoast] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function memberDisplay(m: Member) {
    return m.nickname ? `${m.name} (${m.nickname})` : m.name;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!awardName.trim()) { setError("Award name is required."); return; }
    if (!recipientId) { setError("Please select a recipient."); return; }
    startTransition(async () => {
      const res = await giveAward(awardName, recipientId, year, description, isRoast);
      if (res.success) {
        const recipient = members.find(m => m.id === recipientId) ?? null;
        const givenByMember = members.find(m => m.id === myMemberId) ?? null;
        setAwards([{
          id: res.id!,
          award_name: awardName.trim(),
          recipient_id: recipientId,
          year,
          description: description.trim() || null,
          is_roast: isRoast,
          given_by: myMemberId,
          recipient,
          givenByMember,
        }, ...awards]);
        setAwardName(""); setRecipientId(""); setDescription(""); setIsRoast(false); setError("");
        setShowForm(false);
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteAward(id);
      if (res.success) setAwards(awards.filter(a => a.id !== id));
    });
  }

  const canDelete = myRole === "owner" || myRole === "adult";

  // Group by year
  const byYear = new Map<number, Award[]>();
  for (const a of awards) {
    if (!byYear.has(a.year)) byYear.set(a.year, []);
    byYear.get(a.year)!.push(a);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b - a);

  return (
    <div className="mt-8">
      {/* Annual nudge */}
      {daysSinceLastAward !== null && daysSinceLastAward > 300 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800/40 dark:bg-yellow-900/20">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Time for Awards Night!</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">It&apos;s been over a year since the last award. Gather the family — someone deserves a trophy (or a gentle roast).</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          🏆 Give an award
        </button>
      </div>

      {/* Award form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Give an award</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Award name <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  {showSuggestions ? "Hide suggestions" : "Need ideas?"}
                </button>
              </div>
              {showSuggestions && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTED_AWARDS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setAwardName(s); setShowSuggestions(false); }}
                      className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={awardName}
                onChange={e => setAwardName(e.target.value)}
                autoFocus
                placeholder="e.g. Most Likely to Fall Asleep During a Movie"
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Recipient <span className="text-red-500">*</span>
                </label>
                <select
                  value={recipientId}
                  onChange={e => setRecipientId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="">-- Select recipient --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{memberDisplay(m)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={e => setYear(parseInt(e.target.value))}
                  min={2000}
                  max={2099}
                  className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">The roast (explain why they deserve this)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Give the full story. Be specific. Be honest. Be kind-ish."
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isRoast}
                onChange={e => setIsRoast(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">Mark as a roast award 🔥</span>
            </label>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {isPending ? "Presenting…" : "Present award 🏆"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(""); }} className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)]">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {awards.length === 0 && (
        <div className="mt-20 text-center">
          <div className="text-5xl">🏆</div>
          <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">No awards yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-sm mx-auto">
            Every family has someone who deserves recognition. Start the shelf — heartfelt or hilarious, it&apos;s up to you.
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">Pro tip: hold an annual Family Awards Night. Pick a couch. Dim the lights. Give a speech.</p>
        </div>
      )}

      {/* Awards by year */}
      {years.map(y => (
        <div key={y} className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-xl font-bold text-[var(--foreground)]">{y} Awards</h2>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(byYear.get(y) ?? []).map(award => {
              const r = award.recipient;
              return (
                <div
                  key={award.id}
                  className={`group relative rounded-2xl border p-5 ${award.is_roast ? "border-orange-200 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-900/10" : "border-[var(--border)] bg-[var(--card)]"}`}
                >
                  <div className="mb-3 text-2xl">{award.is_roast ? "🔥" : "🏆"}</div>
                  <h3 className="font-display text-base font-semibold text-[var(--foreground)]">{award.award_name}</h3>

                  {r && (
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: r.color ?? "var(--accent)" }}
                      >
                        {(r.nickname ?? r.name).charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-[var(--foreground)]">{r.nickname ?? r.name}</span>
                    </div>
                  )}

                  {award.description && (
                    <p className="mt-2 text-sm text-[var(--muted)] italic">&ldquo;{award.description}&rdquo;</p>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(award.id)}
                      disabled={isPending}
                      className="absolute right-3 top-3 hidden rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-red-500 group-hover:block"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
