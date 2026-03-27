"use client";

import { useState, useTransition } from "react";
import { addQuote, deleteQuote } from "./actions";

type Member = { id: string; name: string; nickname: string | null; color: string | null };

type Quote = {
  id: string;
  quote: string;
  said_by: string | null;
  context: string | null;
  date_said: string | null;
  created_at: string;
  saidByMember?: Member | null;
};

type Props = {
  quotes: Quote[];
  members: Member[];
  myMemberId: string | null;
  myRole: string;
};

export function QuotesFeed({ quotes: initial, members, myMemberId, myRole }: Props) {
  const [quotes, setQuotes] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [quote, setQuote] = useState("");
  const [saidBy, setSaidBy] = useState("");
  const [context, setContext] = useState("");
  const [dateSaid, setDateSaid] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function memberDisplay(m: Member) {
    return m.nickname ? `${m.name} (${m.nickname})` : m.name;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quote.trim()) { setError("Quote text is required."); return; }
    startTransition(async () => {
      const res = await addQuote(quote, saidBy, context, dateSaid);
      if (res.success) {
        const member = members.find(m => m.id === saidBy) ?? null;
        setQuotes([{
          id: res.id!,
          quote: quote.trim(),
          said_by: saidBy || null,
          context: context.trim() || null,
          date_said: dateSaid || null,
          created_at: new Date().toISOString(),
          saidByMember: member,
        }, ...quotes]);
        setQuote(""); setSaidBy(""); setContext(""); setDateSaid(""); setError("");
        setShowForm(false);
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteQuote(id);
      if (res.success) setQuotes(quotes.filter(q => q.id !== id));
    });
  }

  const canDelete = myRole === "owner" || myRole === "adult";

  return (
    <div className="mt-8">
      {/* Add quote button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Add quote
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-[var(--foreground)]">New quote</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">
                The quote <span className="text-red-500">*</span>
              </label>
              <textarea
                value={quote}
                onChange={e => setQuote(e.target.value)}
                rows={3}
                autoFocus
                placeholder={`"I don't want to go to bed, I want to stay up forever!"`}
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">Who said it</label>
                <select
                  value={saidBy}
                  onChange={e => setSaidBy(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="">-- Select member --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{memberDisplay(m)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)]">Date said</label>
                <input
                  type="date"
                  value={dateSaid}
                  onChange={e => setDateSaid(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Context / story behind it</label>
              <input
                type="text"
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="e.g. On the way home from school..."
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save quote"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); }}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {quotes.length === 0 && (
        <div className="mt-20 text-center">
          <div className="text-5xl">💬</div>
          <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">No quotes yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-sm mx-auto">
            Kids say the wildest things. Start capturing them before they're forgotten.
          </p>
        </div>
      )}

      {/* Quotes feed */}
      <div className="space-y-5">
        {quotes.map(q => {
          const m = q.saidByMember;
          return (
            <div key={q.id} className="group relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
              {/* Big quote text */}
              <p className="font-display text-xl leading-snug text-[var(--foreground)] before:content-['\u201c'] after:content-['\u201d']">
                {q.quote}
              </p>

              {/* Attribution */}
              <div className="mt-4 flex items-center gap-3">
                {m && (
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: m.color ?? "var(--accent)" }}
                  >
                    {(m.nickname ?? m.name).charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="text-sm text-[var(--muted)]">
                  {m ? <span className="font-medium text-[var(--foreground)]">{m.nickname ?? m.name}</span> : <span>Unknown</span>}
                  {q.date_said && (
                    <span> · {new Date(q.date_said).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })}</span>
                  )}
                </div>
              </div>

              {/* Context */}
              {q.context && (
                <p className="mt-2 text-sm italic text-[var(--muted)]">{q.context}</p>
              )}

              {/* Delete */}
              {canDelete && (
                <button
                  onClick={() => handleDelete(q.id)}
                  disabled={isPending}
                  className="absolute right-4 top-4 hidden rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-red-500 group-hover:block"
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
  );
}
