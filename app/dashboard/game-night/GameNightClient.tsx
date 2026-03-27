"use client";

import { useState, useTransition } from "react";
import { logSession, deleteSession } from "./actions";

type Member = { id: string; name: string; nickname: string | null; color: string | null };
type Game = { id: string; name: string };

type Session = {
  id: string;
  game_id: string | null;
  gameName: string | null;
  played_on: string;
  winner_id: string | null;
  notes: string | null;
  winner?: Member | null;
};

type Props = {
  sessions: Session[];
  games: Game[];
  members: Member[];
  myRole: string;
};

export function GameNightClient({ sessions: initial, games: initialGames, members, myRole }: Props) {
  const [sessions, setSessions] = useState(initial);
  const [games, setGames] = useState(initialGames);
  const [showForm, setShowForm] = useState(false);
  const [gameName, setGameName] = useState("");
  const [playedOn, setPlayedOn] = useState(new Date().toISOString().slice(0, 10));
  const [winnerId, setWinnerId] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Tab: log vs leaderboard
  const [tab, setTab] = useState<"log" | "leaderboard">("log");

  function memberDisplay(m: Member) {
    return m.nickname ? `${m.name} (${m.nickname})` : m.name;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await logSession(gameName, playedOn, winnerId, notes);
      if (res.success) {
        const winner = members.find(m => m.id === winnerId) ?? null;
        // Add to game list if new
        if (gameName.trim() && !games.find(g => g.name.toLowerCase() === gameName.trim().toLowerCase())) {
          setGames([...games, { id: res.id!, name: gameName.trim() }].sort((a, b) => a.name.localeCompare(b.name)));
        }
        setSessions([{
          id: res.id!,
          game_id: null,
          gameName: gameName.trim() || null,
          played_on: playedOn,
          winner_id: winnerId || null,
          notes: notes.trim() || null,
          winner,
        }, ...sessions]);
        setGameName(""); setWinnerId(""); setNotes("");
        setPlayedOn(new Date().toISOString().slice(0, 10));
        setShowForm(false);
      } else {
        setFormError(res.error ?? "Something went wrong.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteSession(id);
      if (res.success) setSessions(sessions.filter(s => s.id !== id));
    });
  }

  const canDelete = myRole === "owner" || myRole === "adult";

  // Leaderboard: count wins
  const winCounts = new Map<string, { member: Member; wins: number }>();
  for (const s of sessions) {
    if (!s.winner_id) continue;
    const m = members.find(m => m.id === s.winner_id);
    if (!m) continue;
    if (!winCounts.has(s.winner_id)) winCounts.set(s.winner_id, { member: m, wins: 0 });
    winCounts.get(s.winner_id)!.wins++;
  }
  const leaderboard = Array.from(winCounts.values()).sort((a, b) => b.wins - a.wins);

  return (
    <div className="mt-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2 rounded-lg border border-[var(--border)] p-1">
          <button onClick={() => setTab("log")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "log" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"}`}>
            Game Log
          </button>
          <button onClick={() => setTab("leaderboard")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "leaderboard" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"}`}>
            🏆 Leaderboard
          </button>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          + Log session
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Log a game session</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Game name</label>
              <input
                type="text"
                value={gameName}
                onChange={e => setGameName(e.target.value)}
                autoFocus
                list="games-list"
                placeholder="e.g. Settlers of Catan, Yahtzee, Scrabble…"
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
              {games.length > 0 && (
                <datalist id="games-list">
                  {games.map(g => <option key={g.id} value={g.name} />)}
                </datalist>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">Date played</label>
                <input type="date" value={playedOn} onChange={e => setPlayedOn(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">Winner</label>
                <select value={winnerId} onChange={e => setWinnerId(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none">
                  <option value="">-- No winner / tie --</option>
                  {members.map(m => <option key={m.id} value={m.id}>{memberDisplay(m)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Epic comeback, played 2 rounds…" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none" />
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {isPending ? "Saving…" : "Log session"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setFormError(""); }} className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)]">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leaderboard tab */}
      {tab === "leaderboard" && (
        <div>
          {leaderboard.length === 0 ? (
            <div className="mt-20 text-center">
              <div className="text-5xl">🎲</div>
              <p className="mt-4 text-sm text-[var(--muted)]">Log some sessions first to see who&apos;s winning.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, i) => (
                <div key={entry.member.id} className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="text-2xl font-bold text-[var(--muted)]">#{i + 1}</div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: entry.member.color ?? "var(--accent)" }}>
                    {(entry.member.nickname ?? entry.member.name).charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--foreground)]">{entry.member.nickname ?? entry.member.name}</p>
                    <p className="text-sm text-[var(--muted)]">{entry.wins} {entry.wins === 1 ? "win" : "wins"}</p>
                  </div>
                  {i === 0 && <span className="text-2xl">👑</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Log tab */}
      {tab === "log" && (
        <div>
          {sessions.length === 0 && (
            <div className="mt-20 text-center">
              <div className="text-5xl">🎲</div>
              <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">No sessions yet</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">Start logging game nights — Yahtzee, Settlers of Catan, whatever your family plays.</p>
            </div>
          )}
          <div className="space-y-3">
            {sessions.map(s => {
              const w = s.winner;
              return (
                <div key={s.id} className="group flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="text-2xl">🎲</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--foreground)]">{s.gameName ?? "Game night"}</span>
                      <span className="text-sm text-[var(--muted)]">· {new Date(s.played_on).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })}</span>
                    </div>
                    {w && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-sm text-[var(--muted)]">Winner:</span>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: w.color ?? "var(--accent)" }}>
                          {(w.nickname ?? w.name).charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-[var(--foreground)]">{w.nickname ?? w.name}</span>
                        <span>🏆</span>
                      </div>
                    )}
                    {s.notes && <p className="mt-1 text-sm text-[var(--muted)]">{s.notes}</p>}
                  </div>
                  {canDelete && (
                    <button onClick={() => handleDelete(s.id)} disabled={isPending} className="hidden rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-red-500 group-hover:block">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
