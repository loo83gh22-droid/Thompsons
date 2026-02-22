"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFamily } from "@/app/dashboard/FamilyContext";
import {
  updateFeedbackStatus,
  respondToFeedback,
  deleteFeedback,
  type FeedbackCategory,
  type FeedbackStatus,
} from "./actions";

type FeedbackItem = {
  id: string;
  category: FeedbackCategory;
  subject: string;
  body: string;
  rating: number | null;
  screenshot_url: string | null;
  status: FeedbackStatus;
  admin_response: string | null;
  responded_at: string | null;
  page_url: string | null;
  created_at: string;
  member_id: string | null;
  family_members?: { display_name: string; photo_url: string | null } | null;
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; bg: string; text: string }> = {
  new: { label: "New", bg: "bg-gray-500/15", text: "text-gray-500" },
  read: { label: "Read", bg: "bg-blue-500/15", text: "text-blue-500" },
  in_progress: { label: "In Progress", bg: "bg-amber-500/15", text: "text-amber-500" },
  resolved: { label: "Resolved", bg: "bg-emerald-500/15", text: "text-emerald-500" },
  wont_fix: { label: "Won\u2019t Fix", bg: "bg-red-500/15", text: "text-red-400" },
};

const CATEGORY_ICONS: Record<FeedbackCategory, string> = {
  feature_request: "\u{1F4A1}",
  bug_report: "\u{26A0}\uFE0F",
  question: "\u{2753}",
  compliment: "\u{2764}\uFE0F",
  other: "\u{1F4AC}",
};

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  feature_request: "Feature Request",
  bug_report: "Bug Report",
  question: "Question",
  compliment: "Compliment",
  other: "Other",
};

export function FeedbackList({ items, isOwner }: { items: FeedbackItem[]; isOwner: boolean }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | FeedbackStatus>("all");
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  async function handleStatusChange(id: string, status: FeedbackStatus) {
    setLoadingAction(id);
    await updateFeedbackStatus(id, status);
    setLoadingAction(null);
    router.refresh();
  }

  async function handleRespond(id: string) {
    const text = responseText[id]?.trim();
    if (!text) return;
    setLoadingAction(id);
    await respondToFeedback(id, text);
    setResponseText((prev) => ({ ...prev, [id]: "" }));
    setLoadingAction(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this feedback?")) return;
    setLoadingAction(id);
    await deleteFeedback(id);
    setLoadingAction(null);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="text-[var(--muted)]">
          {isOwner ? "No feedback submitted yet." : "You haven\u2019t submitted any feedback yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs (owner view) */}
      {isOwner && (
        <div className="flex flex-wrap gap-2">
          {(["all", "new", "read", "in_progress", "resolved", "wont_fix"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors min-h-[32px] ${
                filter === f
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {f === "all" ? "All" : STATUS_CONFIG[f].label}
              {f !== "all" && (
                <span className="ml-1 opacity-70">
                  ({items.filter((i) => i.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Feedback cards */}
      {filtered.map((item) => {
        const expanded = expandedId === item.id;
        const statusConf = STATUS_CONFIG[item.status];
        const isLoading = loadingAction === item.id;

        return (
          <div
            key={item.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
          >
            {/* Summary row */}
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : item.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface-hover)] transition-colors min-h-[44px]"
              aria-expanded={expanded}
            >
              <span className="text-lg" aria-hidden="true">{CATEGORY_ICONS[item.category]}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-[var(--foreground)] truncate">{item.subject}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
                    {statusConf.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span>{CATEGORY_LABELS[item.category]}</span>
                  <span>&middot;</span>
                  <time dateTime={item.created_at}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </time>
                  {isOwner && item.family_members?.display_name && (
                    <>
                      <span>&middot;</span>
                      <span>{item.family_members.display_name}</span>
                    </>
                  )}
                </div>
              </div>
              <svg
                className={`h-4 w-4 text-[var(--muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expanded details */}
            {expanded && (
              <div className="border-t border-[var(--border)] px-4 py-4 space-y-4">
                {/* Rating */}
                {item.rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-[var(--muted)]">Rating:</span>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <span key={v} className={v <= item.rating! ? "opacity-100" : "opacity-25"}>
                        {v <= 3 ? (v === 1 ? "\u{1F61E}" : v === 2 ? "\u{1F641}" : "\u{1F610}") : v === 4 ? "\u{1F642}" : "\u{1F929}"}
                      </span>
                    ))}
                  </div>
                )}

                {/* Body */}
                <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">{item.body}</p>

                {/* Screenshot */}
                {item.screenshot_url && (
                  <a href={item.screenshot_url} target="_blank" rel="noopener noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.screenshot_url}
                      alt="Feedback screenshot"
                      className="max-h-48 rounded-lg border border-[var(--border)] object-contain"
                    />
                  </a>
                )}

                {/* Admin response */}
                {item.admin_response && (
                  <div className="rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 p-3">
                    <p className="text-xs font-medium text-[var(--primary)] mb-1">Response from admin</p>
                    <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">{item.admin_response}</p>
                    {item.responded_at && (
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {new Date(item.responded_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Owner actions */}
                {isOwner && (
                  <div className="space-y-3 border-t border-[var(--border)] pt-3">
                    {/* Status change */}
                    <div className="flex items-center gap-2">
                      <label htmlFor={`status-${item.id}`} className="text-xs font-medium text-[var(--muted)]">Status:</label>
                      <select
                        id={`status-${item.id}`}
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as FeedbackStatus)}
                        disabled={isLoading}
                        className="input-base text-sm py-1 px-2"
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="wont_fix">Won&apos;t Fix</option>
                      </select>
                    </div>

                    {/* Respond */}
                    <div>
                      <textarea
                        value={responseText[item.id] || ""}
                        onChange={(e) => setResponseText((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="Write a response..."
                        rows={2}
                        className="input-base w-full text-sm resize-y"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRespond(item.id)}
                          disabled={isLoading || !responseText[item.id]?.trim()}
                          className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                        >
                          {isLoading ? "Sending\u2026" : "Send Response"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={isLoading}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Non-owner delete own */}
                {!isOwner && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={isLoading}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <p className="text-center text-sm text-[var(--muted)] py-4">
          No feedback matching this filter.
        </p>
      )}
    </div>
  );
}
