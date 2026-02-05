"use client";

import { useState, useEffect } from "react";
import {
  getDeathBoxItems,
  toggleDeathBoxItem,
  uploadDeathBoxFile,
  type DeathBoxItem,
} from "./actions";

const CATEGORY_LABELS: Record<string, string> = {
  Legal: "Legal",
  Healthcare: "Healthcare",
  Financial: "Financial",
  Personal: "Personal",
  Digital: "Digital",
};

export function DeathBoxChecklist() {
  const [items, setItems] = useState<DeathBoxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getDeathBoxItems();
      setItems(data);
    } catch {
      setError("Failed to load checklist.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggle(id: string, isCompleted: boolean) {
    try {
      await toggleDeathBoxItem(id, isCompleted);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_completed: isCompleted } : i))
      );
    } catch {
      setError("Failed to update.");
    }
  }

  async function handleUpload(itemId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(itemId);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      await uploadDeathBoxFile(itemId, formData);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingId(null);
      e.target.value = "";
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="text-[var(--muted)]">Loading checklist...</span>
      </div>
    );
  }

  const byCategory = items.reduce<Record<string, DeathBoxItem[]>>((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const completed = items.filter((i) => i.is_completed).length;
  const total = items.length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          {completed} of {total} completed
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(byCategory).map(([category, categoryItems]) => (
          <div key={category}>
            <h2 className="mb-4 font-display text-lg font-semibold text-[var(--foreground)]">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <ul className="space-y-3">
              {categoryItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-1 items-start gap-3">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={(e) => handleToggle(item.id, e.target.checked)}
                        className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                      />
                      <span
                        className={
                          item.is_completed
                            ? "text-[var(--muted)] line-through"
                            : "text-[var(--foreground)]"
                        }
                      >
                        {item.title}
                      </span>
                    </label>
                    {item.content && (
                      <p className="ml-6 text-xs text-[var(--muted)] sm:ml-0">
                        {item.content}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pl-6 sm:pl-0">
                    {item.file_url ? (
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                      >
                        View file
                      </a>
                    ) : null}
                    <label className="cursor-pointer rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)]">
                      {uploadingId === item.id ? "Uploading..." : item.file_url ? "Replace" : "Upload"}
                      <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        onChange={(e) => handleUpload(item.id, e)}
                        disabled={uploadingId !== null}
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
