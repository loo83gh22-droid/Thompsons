"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

export type DigestItem = {
  id: string;
  type: "journal" | "memo" | "story";
  title: string;
  date: string;
  isPublic: boolean;
  shareToken: string | null;
};

export type Contact = {
  id: string;
  name: string;
  email: string | null;
  relationship: string | null;
};

function typeIcon(type: DigestItem["type"]) {
  if (type === "journal") return "📔";
  if (type === "memo") return "🎙️";
  return "📖";
}

function typeLabel(type: DigestItem["type"]) {
  if (type === "journal") return "Journal";
  if (type === "memo") return "Voice Memo";
  return "Story";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function DigestCuratorClient({
  items,
  contacts,
}: {
  items: DigestItem[];
  contacts: Contact[];
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const contactsWithEmail = contacts.filter((c) => c.email);

  const journalItems = items.filter((i) => i.type === "journal");
  const memoItems = items.filter((i) => i.type === "memo");
  const storyItems = items.filter((i) => i.type === "story");

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleContact(id: string) {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllContacts() {
    setSelectedContactIds(new Set(contactsWithEmail.map((c) => c.id)));
  }

  function deselectAllContacts() {
    setSelectedContactIds(new Set());
  }

  function handleSend() {
    const selectedItems = items.filter((i) => selectedIds.has(i.id));
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to share.");
      return;
    }
    if (selectedContactIds.size === 0) {
      toast.error("Please select at least one contact.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/emails/send-digest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactIds: Array.from(selectedContactIds),
            subject: subject.trim() || undefined,
            message: message.trim() || undefined,
            items: selectedItems.map((i) => ({ type: i.type, id: i.id, title: i.title })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to send");
        toast.success(`Sent to ${data.sent} contact${data.sent !== 1 ? "s" : ""}`);
        setSelectedIds(new Set());
        setSelectedContactIds(new Set());
        setSubject("");
        setMessage("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to send");
      }
    });
  }

  const selectedCount = selectedContactIds.size;
  const canSend = selectedIds.size > 0 && selectedCount > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back link */}
      <Link href="/dashboard/contacts" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Family Contacts
      </Link>

      {/* Page header */}
      <div className="mt-6 mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          Send a Family Update
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Pick a few things from the past few weeks, add a personal note, and send it to the people who&apos;d love to know.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-6 py-12 text-center">
          <p className="text-base font-medium text-[var(--foreground)]">Nothing new in the last 21 days</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add some journal entries, voice memos, or stories first, then come back to share them.
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Content picker */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
              1. Pick what to share
            </h2>
            <div className="space-y-5">
              {journalItems.length > 0 && (
                <ContentSection
                  label="Journal Entries"
                  items={journalItems}
                  selectedIds={selectedIds}
                  onToggle={toggleItem}
                />
              )}
              {memoItems.length > 0 && (
                <ContentSection
                  label="Voice Memos"
                  items={memoItems}
                  selectedIds={selectedIds}
                  onToggle={toggleItem}
                />
              )}
              {storyItems.length > 0 && (
                <ContentSection
                  label="Stories"
                  items={storyItems}
                  selectedIds={selectedIds}
                  onToggle={toggleItem}
                />
              )}
            </div>
            {selectedIds.size > 0 && (
              <p className="mt-4 text-sm text-[var(--accent)] font-medium">
                {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Message section */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
              2. Add a personal note
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Subject line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="This week with the Thompsons"
                  maxLength={100}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Personal message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi everyone, here's what we've been up to..."
                  rows={4}
                  maxLength={1000}
                  className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Contact picker */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                3. Choose who receives this
              </h2>
              {contactsWithEmail.length > 1 && (
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAllContacts}
                    className="text-[var(--accent)] hover:underline"
                  >
                    Select all
                  </button>
                  <span className="text-[var(--muted)]">/</span>
                  <button
                    type="button"
                    onClick={deselectAllContacts}
                    className="text-[var(--muted)] hover:underline"
                  >
                    Deselect all
                  </button>
                </div>
              )}
            </div>

            {contacts.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No contacts yet.{" "}
                <Link href="/dashboard/contacts" className="text-[var(--accent)] hover:underline">
                  Add contacts first
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => {
                  const hasEmail = !!contact.email;
                  return (
                    <label
                      key={contact.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                        hasEmail
                          ? "hover:bg-[var(--surface-hover)]"
                          : "cursor-not-allowed opacity-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!hasEmail}
                        checked={selectedContactIds.has(contact.id)}
                        onChange={() => hasEmail && toggleContact(contact.id)}
                        className="h-4 w-4 rounded accent-[var(--accent)]"
                      />
                      <span className="flex-1 text-sm font-medium text-[var(--foreground)]">
                        {contact.name}
                      </span>
                      {contact.relationship && (
                        <span className="text-xs text-[var(--muted)]">{contact.relationship}</span>
                      )}
                      {!hasEmail && (
                        <span className="rounded-full bg-[var(--surface-hover)] px-2 py-0.5 text-xs text-[var(--muted)]">
                          no email
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Send button */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend || isPending}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <EnvelopeIcon />
              {isPending
                ? "Sending..."
                : `Send update to ${selectedCount > 0 ? selectedCount : ""} contact${selectedCount !== 1 ? "s" : ""}`}
            </button>
            {!canSend && !isPending && (
              <p className="text-xs text-[var(--muted)]">
                {selectedIds.size === 0
                  ? "Select at least one item above"
                  : "Select at least one contact"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ContentSection({
  label,
  items,
  selectedIds,
  onToggle,
}: {
  label: string;
  items: DigestItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <div className="space-y-1.5">
        {items.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                isSelected
                  ? "border-[var(--accent)]/40 bg-[var(--accent)]/8"
                  : "border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {typeIcon(item.type)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">{item.title}</p>
                <p className="text-xs text-[var(--muted)]">
                  {typeLabel(item.type)} · {formatDate(item.date)}
                </p>
              </div>
              {isSelected && (
                <span className="shrink-0 text-[var(--accent)]">
                  <CheckIcon />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
