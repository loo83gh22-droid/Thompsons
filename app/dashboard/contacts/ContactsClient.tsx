"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addContact, updateContact, deleteContact } from "./actions";

type Contact = {
  id: string;
  name: string;
  email: string | null;
  relationship: string | null;
  notes: string | null;
  created_at: string;
};

const RELATIONSHIP_SUGGESTIONS = [
  "Grandma",
  "Grandpa",
  "Uncle",
  "Aunt",
  "Cousin",
  "Family Friend",
  "Godparent",
  "Neighbour",
  "Step-parent",
  "Step-sibling",
  "In-law",
];

function UserGroupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/* ─── Add / Edit Form ─── */

function ContactForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: Partial<Contact>;
  onSave: (name: string, email: string, relationship: string, notes: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [relationship, setRelationship] = useState(initial?.relationship ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    onSave(name, email, relationship, notes);
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-colors";
  const labelClass = "block text-xs font-medium text-[var(--muted)] mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Grandma Rose"
            className={inputClass}
            required
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass}>Relationship</label>
          <input
            type="text"
            list="relationship-suggestions"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="e.g. Grandma, Uncle Dave"
            className={inputClass}
          />
          <datalist id="relationship-suggestions">
            {RELATIONSHIP_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>
      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="grandma@example.com"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Prefers photos over text. Birthday: June 12."
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? "Saving…" : initial?.id ? "Save changes" : "Add contact"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ─── Contact Card ─── */

function ContactCard({
  contact,
  onDeleted,
}: {
  contact: Contact;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave(name: string, email: string, relationship: string, notes: string) {
    startTransition(async () => {
      const result = await updateContact(contact.id, name, email, relationship, notes);
      if (result.success) {
        toast.success("Contact updated");
        setEditing(false);
      } else {
        toast.error(result.error ?? "Failed to update contact");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteContact(contact.id);
      if (result.success) {
        toast.success("Contact removed");
        onDeleted(contact.id);
      } else {
        toast.error(result.error ?? "Failed to delete contact");
      }
    });
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--surface)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--foreground)]">Edit contact</p>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Cancel editing"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <ContactForm
          initial={contact}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          isPending={isPending}
        />
      </div>
    );
  }

  return (
    <div className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--border-hover)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[var(--foreground)]">{contact.name}</span>
            {contact.relationship && (
              <span className="inline-flex items-center rounded-full bg-[var(--accent)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
                {contact.relationship}
              </span>
            )}
          </div>
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="mt-1 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
            >
              <EnvelopeIcon className="h-3.5 w-3.5 shrink-0" />
              {contact.email}
            </a>
          )}
          {contact.notes && (
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{contact.notes}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
            aria-label={`Edit ${contact.name}`}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Removing…" : "Remove"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
              aria-label={`Remove ${contact.name}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page component ─── */

export function ContactsClient({ contacts: initialContacts }: { contacts: Contact[] }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd(name: string, email: string, relationship: string, notes: string) {
    startTransition(async () => {
      const result = await addContact(name, email, relationship, notes);
      if (result.success) {
        toast.success("Contact added");
        setShowAddForm(false);
        // Optimistically add a placeholder; the page will revalidate in the background
        setContacts((prev) =>
          [...prev, {
            id: crypto.randomUUID(),
            name: name.trim(),
            email: email.trim() || null,
            relationship: relationship.trim() || null,
            notes: notes.trim() || null,
            created_at: new Date().toISOString(),
          }].sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        toast.error(result.error ?? "Failed to add contact");
      }
    });
  }

  function handleDeleted(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <UserGroupIcon className="h-7 w-7 text-[var(--accent)]" />
              <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
                Family Contacts
              </h1>
            </div>
            <p className="mt-1.5 text-sm text-[var(--muted)]">
              People outside your Nest who matter — grandparents, aunts, old friends.
              Share moments with them without giving them an account.
            </p>
          </div>
          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
            >
              <PlusIcon className="h-4 w-4" />
              Add contact
            </button>
          )}
        </div>
      </div>

      {/* Info callout */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          <span className="font-semibold text-[var(--foreground)]">Contacts don&apos;t need a Family Nest account.</span>{" "}
          Share individual memories, photos, and stories with them by email or link. They receive
          what you choose, nothing more. Nothing else in your Nest is visible to them.
        </p>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6 rounded-xl border border-[var(--accent)]/30 bg-[var(--surface)] p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--foreground)]">New contact</h2>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Close form"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <ContactForm
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
            isPending={isPending}
          />
        </div>
      )}

      {/* Contact list */}
      {contacts.length > 0 ? (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} onDeleted={handleDeleted} />
          ))}
        </div>
      ) : (
        !showAddForm && (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-6 py-12 text-center">
            <UserGroupIcon className="mx-auto mb-3 h-10 w-10 text-[var(--muted)]" />
            <p className="text-base font-medium text-[var(--foreground)]">No contacts yet</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Add grandma&apos;s email and start sharing moments with her.
            </p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
            >
              <PlusIcon className="h-4 w-4" />
              Add your first contact
            </button>
          </div>
        )
      )}
    </div>
  );
}
