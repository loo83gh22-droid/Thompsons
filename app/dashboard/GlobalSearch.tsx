"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/app/api/search/route";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Keyboard shortcut: Cmd/Ctrl + K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setResults([]);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.results || []);
      setSelectedIdx(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
  }

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(result.href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      e.preventDefault();
      handleSelect(results[selectedIdx]);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        aria-label="Search"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--muted)] sm:inline">
          Ctrl K
        </kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          setOpen(false);
          setQuery("");
          setResults([]);
        }}
      />

      {/* Search panel */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--muted)]"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search memories, people, recipes..."
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
          />
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--muted)] border-t-transparent" />
          )}
          <kbd
            className="rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--muted)] cursor-pointer"
            onClick={() => { setOpen(false); setQuery(""); setResults([]); }}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-[50vh] overflow-y-auto py-2">
            {results.map((r, i) => (
              <li key={`${r.type}-${r.id}`}>
                <button
                  type="button"
                  onClick={() => handleSelect(r)}
                  className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selectedIdx
                      ? "bg-[var(--accent)]/10 text-[var(--foreground)]"
                      : "text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-base" aria-hidden>{r.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    {r.snippet && (
                      <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{r.snippet}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded bg-[var(--surface-hover)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)] capitalize">
                    {r.type.replace("_", " ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {query.trim().length >= 2 && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Hint */}
        {query.trim().length < 2 && (
          <div className="px-4 py-6 text-center text-xs text-[var(--muted)]">
            Search across journal entries, stories, recipes, members, and more.
          </div>
        )}
      </div>
    </div>
  );
}
