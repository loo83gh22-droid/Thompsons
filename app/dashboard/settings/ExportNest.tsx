"use client";

import { useState, useEffect, useCallback } from "react";

type ExportStatus = {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  file_size_bytes: number | null;
  expires_at: string | null;
  error_message: string | null;
  download_url: string | null;
  created_at: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function ExportNest() {
  const [exportData, setExportData] = useState<ExportStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/export");
      const data = await res.json();
      if (data.export) setExportData(data.export);
      else setExportData(null);
    } catch {
      /* ignore polling errors */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Poll while processing
  useEffect(() => {
    if (
      generating ||
      exportData?.status === "pending" ||
      exportData?.status === "processing"
    ) {
      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [generating, exportData?.status, checkStatus]);

  // Stop generating spinner when complete
  useEffect(() => {
    if (
      exportData?.status === "completed" ||
      exportData?.status === "failed"
    ) {
      setGenerating(false);
    }
  }, [exportData?.status]);

  async function handleExport() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/export", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export failed");
      if (data.export) setExportData(data.export);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
      setGenerating(false);
    }
  }

  const isExpired =
    exportData?.expires_at && new Date(exportData.expires_at) < new Date();
  const isReady =
    exportData?.status === "completed" &&
    exportData.download_url &&
    !isExpired;
  const isProcessing =
    generating ||
    exportData?.status === "pending" ||
    exportData?.status === "processing";

  if (loading) {
    return (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-lg font-semibold">Export My Nest</h2>
        </div>
        <div className="px-6 py-5 text-sm text-[var(--muted)]">Loading...</div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="border-b border-[var(--border)] px-6 py-4">
        <h2 className="text-lg font-semibold">Export My Nest</h2>
      </div>

      <div className="space-y-4 px-6 py-5">
        <p className="text-sm text-[var(--muted)]">
          Download a complete archive of your family&apos;s data — photos,
          journals, stories, recipes, voice memos, traditions, time capsules,
          family tree, and map locations — all packaged as a .zip file.
        </p>

        {/* Error */}
        {(error || exportData?.status === "failed") && (
          <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
            {error || exportData?.error_message || "Export failed. Please try again."}
          </div>
        )}

        {/* Processing state */}
        {isProcessing && (
          <div className="flex items-center gap-3 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Generating your export...
              </p>
              <p className="text-xs text-[var(--muted)]">
                This may take a few minutes depending on how much data you have.
              </p>
            </div>
          </div>
        )}

        {/* Ready to download */}
        {isReady && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-900/15 px-4 py-3">
              <span className="text-lg" aria-hidden="true">
                ✓
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-400">
                  Export ready
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {exportData.file_size_bytes
                    ? formatSize(exportData.file_size_bytes)
                    : ""}{" "}
                  — Available until{" "}
                  {new Date(exportData.expires_at!).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <a
              href={exportData.download_url!}
              download
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--accent)]/90"
            >
              Download Archive
              <span aria-hidden="true">&darr;</span>
            </a>
          </div>
        )}

        {/* Expired */}
        {exportData?.status === "completed" && isExpired && (
          <div className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
            Your previous export has expired. Generate a new one below.
          </div>
        )}

        {/* Generate button (when no active export or expired) */}
        {!isProcessing && !isReady && (
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-5 py-2.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
          >
            Export My Nest
            <span aria-hidden="true">&darr;</span>
          </button>
        )}

        {/* Re-export when one exists */}
        {isReady && (
          <button
            type="button"
            onClick={handleExport}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Generate a new export
          </button>
        )}

        <p className="text-xs text-[var(--muted)]">
          Your export will be available for download for 24 hours. Includes all
          original files.
        </p>
      </div>
    </section>
  );
}
