"use client";

import { useState } from "react";
import {
  lookupUser,
  scrubUser,
  type LookupResult,
  type ScrubResult,
} from "./actions";

export default function ScrubPage() {
  const [email, setEmail] = useState("");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrubResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function handleLookup() {
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    setLookup(null);
    setResult(null);
    setConfirmed(false);
    const res = await lookupUser(trimmed);
    setLookup(res);
    setLoading(false);
  }

  async function handleScrub() {
    const trimmed = email.trim();
    if (!trimmed || !confirmed) return;
    setLoading(true);
    const res = await scrubUser(trimmed);
    setResult(res);
    setLookup(null);
    setLoading(false);
    setConfirmed(false);
    if (res.success) setEmail("");
  }

  const foundLookup = lookup?.found ? lookup : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Scrub User</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Permanently erase all traces of a user from the system.
            </p>
          </div>
          <a
            href="/admin"
            className="text-sm text-slate-500 hover:text-slate-800 underline"
          >
            ← Admin
          </a>
        </div>

        {/* Warning banner */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-800 text-sm font-medium">
            This action is irreversible. Auth account, all family memberships,
            all content, and all storage files will be permanently deleted.
          </p>
        </div>

        {/* Email input */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            User email address
          </label>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLookup(null);
                setResult(null);
                setConfirmed(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              placeholder="user@example.com"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <button
              onClick={handleLookup}
              disabled={loading || !email.trim()}
              className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50 whitespace-nowrap"
            >
              {loading && !foundLookup ? "Searching…" : "Find User"}
            </button>
          </div>
        </div>

        {/* Not found */}
        {lookup && !lookup.found && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <p className="text-yellow-800 text-sm">{lookup.error}</p>
          </div>
        )}

        {/* Preview panel */}
        {foundLookup && !result && (
          <div className="bg-white rounded-xl border border-red-300 p-6 mb-4">
            <h2 className="font-semibold text-slate-800 mb-4">
              User found — review before scrubbing
            </h2>

            <div className="space-y-2 mb-5">
              <div className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">Email:</span>{" "}
                {foundLookup.email}
              </div>
              <div className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">Auth ID:</span>{" "}
                <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                  {foundLookup.authUserId}
                </code>
              </div>
            </div>

            {foundLookup.memberRows.length > 0 ? (
              <div className="mb-5">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Family memberships ({foundLookup.memberRows.length}):
                </p>
                <div className="space-y-2">
                  {foundLookup.memberRows.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-800 flex-1">
                        {m.name}
                      </span>
                      <span className="text-slate-500">{m.familyName}</span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          m.role === "owner"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-5">
                No family memberships found (auth account only).
              </p>
            )}

            {foundLookup.isOwnerAnywhere && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-sm text-amber-800">
                This user owns one or more families. Those families will be left
                ownerless after scrubbing — their other members&apos; data will
                be preserved.
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none mb-4">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="rounded"
              />
              I understand this cannot be undone
            </label>

            <button
              onClick={handleScrub}
              disabled={!confirmed || loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              {loading ? "Scrubbing…" : "Permanently Scrub This User"}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className={`rounded-xl border p-6 ${
              result.success
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <p
              className={`font-semibold mb-3 ${
                result.success ? "text-green-800" : "text-red-800"
              }`}
            >
              {result.success ? "✓ " : "✗ "}
              {result.message}
            </p>
            {result.details.length > 0 && (
              <div className="bg-black/5 rounded-lg p-3 space-y-0.5">
                {result.details.map((d, i) => (
                  <p key={i} className="text-xs text-slate-600 font-mono">
                    {d}
                  </p>
                ))}
              </div>
            )}
            {result.success && (
              <button
                onClick={() => setResult(null)}
                className="mt-4 text-sm text-green-700 underline hover:text-green-900"
              >
                Scrub another user
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
