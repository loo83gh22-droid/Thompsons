"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ImportPreview } from "./ImportPreview";
import { parseJson, parseZip } from "./parsers";
import { executeImport } from "./actions";
import type { ContentType, ParseResult, ParsedRow } from "./parsers";
import type { ImportResult } from "./actions";

type Step = "upload" | "preview" | "importing" | "done";

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  journal_entries: "Journal Entries",
  stories: "Stories",
  recipes: "Recipes",
  events: "Events",
};

const CONTENT_TYPE_PATHS: Record<ContentType, string> = {
  journal_entries: "/dashboard/journal",
  stories: "/dashboard/stories",
  recipes: "/dashboard/recipes",
  events: "/dashboard/events",
};

interface MultiResult {
  type: ContentType;
  result: ImportResult;
}

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [parseResults, setParseResults] = useState<ParseResult[]>([]);
  const [globalWarnings, setGlobalWarnings] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<MultiResult[]>([]);

  // Selected content type tab (when preview has multiple)
  const [activeTab, setActiveTab] = useState<ContentType | null>(null);

  const processFile = useCallback(async (file: File) => {
    setParseError(null);
    setParseResults([]);
    setGlobalWarnings([]);
    setActiveTab(null);

    try {
      let results: ParseResult[];
      let warnings: string[] = [];

      if (file.name.endsWith(".zip")) {
        const zipResult = await parseZip(file);
        results = zipResult.results;
        warnings = zipResult.warnings;
      } else if (file.name.endsWith(".json")) {
        const text = await file.text();
        const r = parseJson(text);
        results = [r];
        warnings = r.warnings;
      } else {
        setParseError("Unsupported file type. Please upload a .json or .zip file.");
        return;
      }

      if (results.length === 0) {
        setParseError("No importable content found in the file.");
        return;
      }

      setParseResults(results);
      setGlobalWarnings(warnings);
      setActiveTab(results[0].type);
      setStep("preview");
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Failed to parse file.");
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleImport = async () => {
    setStep("importing");
    const results: MultiResult[] = [];

    for (const pr of parseResults) {
      const result = await executeImport(pr.rows as ParsedRow[], pr.type);
      results.push({ type: pr.type, result });
    }

    setImportResults(results);
    setStep("done");
  };

  const totalRows = parseResults.reduce((s, r) => s + r.rows.length, 0);
  const activeResult = parseResults.find((r) => r.type === activeTab);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/settings"
          className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-sm"
        >
          ← Settings
        </Link>
        <span className="text-[var(--border)]">/</span>
        <h1 className="text-lg font-semibold text-[var(--foreground)]">
          Import Content
        </h1>
      </div>

      {/* Upload step */}
      {step === "upload" && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="border-b border-[var(--border)] px-6 py-4">
            <h2 className="text-base font-semibold">Choose a file to import</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Supports <strong>.json</strong> (structured data) and{" "}
              <strong>.zip</strong> (exported archive from this app).
            </p>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed px-8 py-12 text-center transition-colors ${
                isDragging
                  ? "border-[var(--accent)] bg-[var(--accent)]/5"
                  : "border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
              }`}
            >
              <div className="text-3xl mb-3" aria-hidden="true">
                📂
              </div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Drop a file here or click to browse
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                .json or .zip — max 50 MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.zip"
                className="sr-only"
                onChange={handleFileChange}
              />
            </div>

            {parseError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {parseError}
              </div>
            )}

            {/* Format guide */}
            <details className="text-sm">
              <summary className="cursor-pointer text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                JSON format reference
              </summary>
              <div className="mt-3 space-y-3 rounded-lg bg-[var(--surface-hover)] p-4">
                <p className="text-xs text-[var(--muted)]">
                  Use an envelope with <code>type</code> and{" "}
                  <code>entries</code>:
                </p>
                <pre className="overflow-x-auto rounded bg-black/5 p-3 text-xs">
{`{
  "type": "journal_entries",
  "entries": [
    {
      "title": "Trip to Paris",
      "content": "We visited the Eiffel Tower...",
      "trip_date": "2024-06-15",
      "location": "Paris, France",
      "author": "Alice Thompson"
    }
  ]
}`}
                </pre>
                <p className="text-xs text-[var(--muted)]">
                  Supported types:{" "}
                  <code>journal_entries</code>, <code>stories</code>,{" "}
                  <code>recipes</code>, <code>events</code>
                </p>
              </div>
            </details>
          </div>
        </section>
      )}

      {/* Preview step */}
      {step === "preview" && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Preview</h2>
              <p className="mt-0.5 text-sm text-[var(--muted)]">
                Review what will be imported before confirming.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setStep("upload"); setParseResults([]); }}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              ← Change file
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            {globalWarnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                <p className="font-medium">{globalWarnings.length} file warning{globalWarnings.length !== 1 ? "s" : ""}</p>
                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                  {globalWarnings.slice(0, 3).map((w, i) => <li key={i}>{w}</li>)}
                  {globalWarnings.length > 3 && <li>…and {globalWarnings.length - 3} more</li>}
                </ul>
              </div>
            )}

            {/* Tabs for multiple content types (ZIP) */}
            {parseResults.length > 1 && (
              <div className="flex gap-1 rounded-lg bg-[var(--surface-hover)] p-1">
                {parseResults.map((pr) => (
                  <button
                    key={pr.type}
                    type="button"
                    onClick={() => setActiveTab(pr.type)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeTab === pr.type
                        ? "bg-[var(--surface)] shadow-sm text-[var(--foreground)]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {CONTENT_TYPE_LABELS[pr.type]}
                    <span className="ml-1 opacity-60">({pr.rows.length})</span>
                  </button>
                ))}
              </div>
            )}

            {activeResult && (
              <ImportPreview
                type={activeResult.type}
                rows={activeResult.rows}
                warnings={activeResult.warnings}
              />
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleImport}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:opacity-90"
              >
                Import {totalRows} item{totalRows !== 1 ? "s" : ""}
              </button>
              <button
                type="button"
                onClick={() => { setStep("upload"); setParseResults([]); }}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Importing */}
      {step === "importing" && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <p className="text-sm font-medium text-[var(--foreground)]">
            Importing your content…
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">This will only take a moment.</p>
        </section>
      )}

      {/* Done */}
      {step === "done" && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="border-b border-[var(--border)] px-6 py-4">
            <h2 className="text-base font-semibold">Import complete</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            {importResults.map(({ type, result }) => (
              <div
                key={type}
                className="rounded-lg border border-[var(--border)] p-4 space-y-2"
              >
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {CONTENT_TYPE_LABELS[type]}
                </p>
                <div className="flex gap-4 text-xs">
                  <span className="text-green-600">
                    ✓ {result.created} created
                  </span>
                  {result.skipped > 0 && (
                    <span className="text-[var(--muted)]">
                      {result.skipped} skipped
                    </span>
                  )}
                  {result.errors.length > 0 && (
                    <span className="text-red-500">
                      {result.errors.length} error{result.errors.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {result.errors.length > 0 && (
                  <ul className="text-xs text-red-500 list-disc pl-4 space-y-0.5">
                    {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                    {result.errors.length > 5 && <li>…and {result.errors.length - 5} more</li>}
                  </ul>
                )}
                <Link
                  href={CONTENT_TYPE_PATHS[type]}
                  className="inline-block text-xs text-[var(--accent)] hover:underline"
                >
                  View {CONTENT_TYPE_LABELS[type]} →
                </Link>
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setStep("upload"); setParseResults([]); setImportResults([]); }}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Import another file
              </button>
              <Link
                href="/dashboard/settings"
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Back to Settings
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
