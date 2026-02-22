"use client";

import type {
  ContentType,
  ParsedJournalEntry,
  ParsedStory,
  ParsedRecipe,
  ParsedEvent,
  ParsedRow,
} from "./parsers";

interface Props {
  type: ContentType;
  rows: ParsedRow[];
  warnings: string[];
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  journal_entries: "Journal Entries",
  stories: "Stories",
  recipes: "Recipes",
  events: "Events",
};

export function ImportPreview({ type, rows, warnings }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          {CONTENT_TYPE_LABELS[type]}
          <span className="ml-2 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs text-[var(--accent)]">
            {rows.length} item{rows.length !== 1 ? "s" : ""}
          </span>
        </h3>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 space-y-1">
          <p className="font-medium">Warnings ({warnings.length})</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {warnings.slice(0, 5).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
            {warnings.length > 5 && (
              <li>…and {warnings.length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
              {type === "journal_entries" && (
                <>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Title</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Location</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Author</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Content</th>
                </>
              )}
              {type === "stories" && (
                <>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Title</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Category</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Author</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Content</th>
                </>
              )}
              {type === "recipes" && (
                <>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Title</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Occasions</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Has Ingredients</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Has Instructions</th>
                </>
              )}
              {type === "events" && (
                <>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Title</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Category</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Recurring</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.slice(0, 50).map((row, i) => (
              <tr
                key={i}
                className="hover:bg-[var(--surface-hover)] transition-colors"
              >
                {type === "journal_entries" && (() => {
                  const r = row as ParsedJournalEntry;
                  return (
                    <>
                      <td className="px-3 py-2 font-medium text-[var(--foreground)] max-w-[180px] truncate">{r.title}</td>
                      <td className="px-3 py-2 text-[var(--muted)]">{r.trip_date ?? "—"}</td>
                      <td className="px-3 py-2 text-[var(--muted)] max-w-[120px] truncate">{r.location ?? "—"}</td>
                      <td className="px-3 py-2 text-[var(--muted)]">{r.author ?? "—"}</td>
                      <td className="px-3 py-2 text-[var(--muted)] max-w-[200px] truncate">
                        {r.content ? r.content.slice(0, 60) + (r.content.length > 60 ? "…" : "") : "—"}
                      </td>
                    </>
                  );
                })()}
                {type === "stories" && (() => {
                  const r = row as ParsedStory;
                  return (
                    <>
                      <td className="px-3 py-2 font-medium text-[var(--foreground)] max-w-[200px] truncate">{r.title}</td>
                      <td className="px-3 py-2 text-[var(--muted)]">{r.category ?? "other"}</td>
                      <td className="px-3 py-2 text-[var(--muted)]">{r.author ?? "—"}</td>
                      <td className="px-3 py-2 text-[var(--muted)] max-w-[200px] truncate">
                        {r.content ? r.content.slice(0, 60) + (r.content.length > 60 ? "…" : "") : "—"}
                      </td>
                    </>
                  );
                })()}
                {type === "recipes" && (() => {
                  const r = row as ParsedRecipe;
                  return (
                    <>
                      <td className="px-3 py-2 font-medium text-[var(--foreground)] max-w-[200px] truncate">{r.title}</td>
                      <td className="px-3 py-2 text-[var(--muted)]">{r.occasions ?? "—"}</td>
                      <td className="px-3 py-2 text-[var(--muted)]">{r.ingredients ? "Yes" : "No"}</td>
                      <td className="px-3 py-2 text-[var(--muted)]">{r.instructions ? "Yes" : "No"}</td>
                    </>
                  );
                })()}
                {type === "events" && (() => {
                  const r = row as ParsedEvent;
                  return (
                    <>
                      <td className="px-3 py-2 font-medium text-[var(--foreground)] max-w-[200px] truncate">{r.title}</td>
                      <td className="px-3 py-2 text-[var(--muted)]">{r.event_date}</td>
                      <td className="px-3 py-2 text-[var(--muted)]">{r.category ?? "other"}</td>
                      <td className="px-3 py-2 text-[var(--muted)]">{r.recurring ?? "none"}</td>
                    </>
                  );
                })()}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 50 && (
          <div className="border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--muted)]">
            Showing first 50 of {rows.length} items
          </div>
        )}
      </div>
    </div>
  );
}
