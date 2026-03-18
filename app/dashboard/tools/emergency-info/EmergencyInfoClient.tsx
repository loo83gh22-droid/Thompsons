"use client";

import { useState, useTransition } from "react";
import { useFamily } from "@/app/dashboard/FamilyContext";
import {
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  upsertMedicalInfo,
} from "./actions";

// ─── Types ───

type Member = {
  id: string;
  name: string;
  nickname: string | null;
  role: string;
  avatar_url: string | null;
};

type Contact = {
  id: string;
  family_id: string;
  member_id: string | null;
  contact_name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  notes: string | null;
  sort_order: number;
  created_at: string;
};

type MedicalRecord = {
  id: string;
  family_id: string;
  member_id: string;
  blood_type: string | null;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
  doctor_name: string | null;
  doctor_phone: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  notes: string | null;
  updated_at: string;
};

type Props = {
  members: Member[];
  contacts: Contact[];
  medicalRecords: MedicalRecord[];
};

// ─── Blood type options ───

const BLOOD_TYPES = [
  "",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
];

// ─── Main Component ───

export default function EmergencyInfoClient({
  members,
  contacts,
  medicalRecords,
}: Props) {
  const { currentUserRole } = useFamily();
  const canEdit = currentUserRole === "owner" || currentUserRole === "adult";

  const [activeTab, setActiveTab] = useState<"contacts" | "medical">(
    "contacts"
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="font-display text-2xl font-bold"
          style={{ color: "var(--foreground)" }}
        >
          Emergency Info
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Keep important contacts and medical details in one secure place.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="mb-6 flex gap-1 rounded-xl p-1"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <button
          onClick={() => setActiveTab("contacts")}
          className="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor:
              activeTab === "contacts" ? "var(--card)" : "transparent",
            color:
              activeTab === "contacts" ? "var(--foreground)" : "var(--muted)",
            boxShadow:
              activeTab === "contacts"
                ? "0 1px 3px rgba(0,0,0,0.08)"
                : "none",
          }}
        >
          Emergency Contacts
        </button>
        <button
          onClick={() => setActiveTab("medical")}
          className="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor:
              activeTab === "medical" ? "var(--card)" : "transparent",
            color:
              activeTab === "medical" ? "var(--foreground)" : "var(--muted)",
            boxShadow:
              activeTab === "medical"
                ? "0 1px 3px rgba(0,0,0,0.08)"
                : "none",
          }}
        >
          Medical Info
        </button>
      </div>

      {activeTab === "contacts" ? (
        <ContactsSection
          contacts={contacts}
          members={members}
          canEdit={canEdit}
        />
      ) : (
        <MedicalSection
          members={members}
          medicalRecords={medicalRecords}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}

// ─── Contacts Section ───

function ContactsSection({
  contacts,
  members,
  canEdit,
}: {
  contacts: Contact[];
  members: Member[];
  canEdit: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const primaryContacts = contacts.filter((c) => c.is_primary);
  const otherContacts = contacts.filter((c) => !c.is_primary);

  return (
    <div>
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: "rgba(220, 38, 38, 0.1)" }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="rgb(220, 38, 38)"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
              />
            </svg>
          </div>
          <h2
            className="font-display text-lg font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Emergency Contacts
          </h2>
        </div>
        {canEdit && !showForm && (
          <button
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "var(--accent)" }}
          >
            + Add Contact
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <ContactForm
          members={members}
          contact={
            editingId ? contacts.find((c) => c.id === editingId) : undefined
          }
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}

      {/* Empty state */}
      {contacts.length === 0 && !showForm && (
        <div
          className="rounded-xl border py-12 text-center"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}
        >
          <svg
            className="mx-auto mb-3 h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="var(--muted)"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
            />
          </svg>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--foreground)" }}
          >
            No emergency contacts yet
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Add your first one to keep important numbers in one place.
          </p>
        </div>
      )}

      {/* Primary contacts */}
      {primaryContacts.length > 0 && (
        <div className="mb-4">
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-wide"
            style={{ color: "rgb(220, 38, 38)" }}
          >
            Primary
          </p>
          <div className="space-y-2">
            {primaryContacts.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                members={members}
                canEdit={canEdit}
                onEdit={() => {
                  setEditingId(c.id);
                  setShowForm(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other contacts */}
      {otherContacts.length > 0 && (
        <div>
          {primaryContacts.length > 0 && (
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--muted)" }}
            >
              Other Contacts
            </p>
          )}
          <div className="space-y-2">
            {otherContacts.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                members={members}
                canEdit={canEdit}
                onEdit={() => {
                  setEditingId(c.id);
                  setShowForm(true);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Contact Card ───

function ContactCard({
  contact,
  members,
  canEdit,
  onEdit,
}: {
  contact: Contact;
  members: Member[];
  canEdit: boolean;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const linkedMember = contact.member_id
    ? members.find((m) => m.id === contact.member_id)
    : null;

  function handleDelete() {
    startTransition(async () => {
      await deleteEmergencyContact(contact.id);
      setShowDeleteConfirm(false);
    });
  }

  return (
    <div
      className="rounded-xl border p-4 transition-colors"
      style={{
        borderColor: contact.is_primary
          ? "rgba(220, 38, 38, 0.25)"
          : "var(--border)",
        backgroundColor: "var(--card)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className="font-display text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {contact.contact_name}
            </h3>
            {contact.is_primary && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: "rgba(220, 38, 38, 0.1)",
                  color: "rgb(220, 38, 38)",
                }}
              >
                Primary
              </span>
            )}
          </div>

          {contact.relationship && (
            <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
              {contact.relationship}
              {linkedMember &&
                ` (linked to ${linkedMember.nickname || linkedMember.name})`}
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-1 text-sm hover:underline"
                style={{ color: "var(--accent)" }}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  />
                </svg>
                {contact.phone}
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1 text-sm hover:underline"
                style={{ color: "var(--accent)" }}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                {contact.email}
              </a>
            )}
          </div>

          {contact.notes && (
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              {contact.notes}
            </p>
          )}
        </div>

        {canEdit && (
          <div className="flex shrink-0 gap-1">
            <button
              onClick={onEdit}
              className="rounded-lg p-1.5 transition-colors hover:opacity-80"
              style={{ color: "var(--muted)" }}
              title="Edit"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                />
              </svg>
            </button>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg p-1.5 transition-colors hover:opacity-80"
                style={{ color: "var(--muted)" }}
                title="Delete"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: "rgb(220, 38, 38)" }}
                >
                  {isPending ? "..." : "Delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg px-2 py-1 text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Contact Form ───

function ContactForm({
  contact,
  members,
  onClose,
}: {
  contact?: Contact;
  members: Member[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!contact;

  const [name, setName] = useState(contact?.contact_name ?? "");
  const [relationship, setRelationship] = useState(
    contact?.relationship ?? ""
  );
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [isPrimary, setIsPrimary] = useState(contact?.is_primary ?? false);
  const [memberId, setMemberId] = useState(contact?.member_id ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Contact name is required.");
      return;
    }

    startTransition(async () => {
      try {
        if (isEditing && contact) {
          await updateEmergencyContact(contact.id, {
            contact_name: name,
            relationship,
            phone,
            email,
            is_primary: isPrimary,
            member_id: memberId || null,
            notes,
          });
        } else {
          await addEmergencyContact({
            contact_name: name,
            relationship,
            phone,
            email,
            is_primary: isPrimary,
            member_id: memberId || null,
            notes,
          });
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  const inputStyle = {
    backgroundColor: "var(--surface)",
    borderColor: "var(--border)",
    color: "var(--foreground)",
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl border p-4"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--card)",
      }}
    >
      <h3
        className="font-display mb-4 text-sm font-semibold"
        style={{ color: "var(--foreground)" }}
      >
        {isEditing ? "Edit Contact" : "Add Emergency Contact"}
      </h3>

      {error && (
        <p
          className="mb-3 rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            color: "rgb(220, 38, 38)",
          }}
        >
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            className="mb-1 block text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            style={inputStyle}
            placeholder="Dr. Smith"
          />
        </div>
        <div>
          <label
            className="mb-1 block text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            Relationship
          </label>
          <input
            type="text"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            style={inputStyle}
            placeholder="Family doctor, Neighbor, etc."
          />
        </div>
        <div>
          <label
            className="mb-1 block text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            style={inputStyle}
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <label
            className="mb-1 block text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            style={inputStyle}
            placeholder="doctor@example.com"
          />
        </div>
        <div>
          <label
            className="mb-1 block text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            Linked Family Member
          </label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            style={inputStyle}
          >
            <option value="">None (general contact)</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nickname || m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm" style={{ color: "var(--foreground)" }}>
              Primary contact
            </span>
          </label>
        </div>
      </div>

      <div className="mt-3">
        <label
          className="mb-1 block text-xs font-medium"
          style={{ color: "var(--muted)" }}
        >
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
          style={inputStyle}
          placeholder="Any additional details..."
        />
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{ color: "var(--muted)" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {isPending
            ? "Saving..."
            : isEditing
              ? "Save Changes"
              : "Add Contact"}
        </button>
      </div>
    </form>
  );
}

// ─── Medical Section ───

function MedicalSection({
  members,
  medicalRecords,
  canEdit,
}: {
  members: Member[];
  medicalRecords: MedicalRecord[];
  canEdit: boolean;
}) {
  const recordMap = new Map(medicalRecords.map((r) => [r.member_id, r]));

  return (
    <div>
      {/* Section header */}
      <div className="mb-4 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="rgb(59, 130, 246)"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </div>
        <h2
          className="font-display text-lg font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          Medical Info
        </h2>
      </div>

      {members.length === 0 ? (
        <div
          className="rounded-xl border py-12 text-center"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No family members found.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {members.map((member) => (
            <MedicalCard
              key={member.id}
              member={member}
              record={recordMap.get(member.id)}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Medical Card (per member) ───

function MedicalCard({
  member,
  record,
  canEdit,
}: {
  member: Member;
  record?: MedicalRecord;
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [bloodType, setBloodType] = useState(record?.blood_type ?? "");
  const [allergies, setAllergies] = useState(record?.allergies ?? "");
  const [medications, setMedications] = useState(record?.medications ?? "");
  const [conditions, setConditions] = useState(record?.conditions ?? "");
  const [doctorName, setDoctorName] = useState(record?.doctor_name ?? "");
  const [doctorPhone, setDoctorPhone] = useState(record?.doctor_phone ?? "");
  const [insuranceProvider, setInsuranceProvider] = useState(
    record?.insurance_provider ?? ""
  );
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(
    record?.insurance_policy_number ?? ""
  );
  const [notes, setNotes] = useState(record?.notes ?? "");
  const [error, setError] = useState("");

  const hasData =
    record &&
    (record.blood_type ||
      record.allergies ||
      record.medications ||
      record.conditions ||
      record.doctor_name ||
      record.insurance_provider ||
      record.notes);

  function handleSave() {
    startTransition(async () => {
      try {
        await upsertMedicalInfo({
          member_id: member.id,
          blood_type: bloodType,
          allergies,
          medications,
          conditions,
          doctor_name: doctorName,
          doctor_phone: doctorPhone,
          insurance_provider: insuranceProvider,
          insurance_policy_number: insurancePolicyNumber,
          notes,
        });
        setIsEditing(false);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleCancel() {
    setBloodType(record?.blood_type ?? "");
    setAllergies(record?.allergies ?? "");
    setMedications(record?.medications ?? "");
    setConditions(record?.conditions ?? "");
    setDoctorName(record?.doctor_name ?? "");
    setDoctorPhone(record?.doctor_phone ?? "");
    setInsuranceProvider(record?.insurance_provider ?? "");
    setInsurancePolicyNumber(record?.insurance_policy_number ?? "");
    setNotes(record?.notes ?? "");
    setIsEditing(false);
    setError("");
  }

  const inputStyle = {
    backgroundColor: "var(--surface)",
    borderColor: "var(--border)",
    color: "var(--foreground)",
  };

  return (
    <div
      className="rounded-xl border"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--card)",
      }}
    >
      {/* Member header */}
      <div
        className="flex items-center justify-between rounded-t-xl px-4 py-3"
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
            style={{
              backgroundColor: "var(--accent)",
              color: "white",
            }}
          >
            {(member.nickname || member.name).charAt(0).toUpperCase()}
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {member.nickname || member.name}
            </p>
            <p className="text-xs capitalize" style={{ color: "var(--muted)" }}>
              {member.role}
            </p>
          </div>
        </div>
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              color: "var(--accent)",
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            {hasData ? "Edit" : "Add Info"}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <p
            className="mb-3 rounded-lg px-3 py-2 text-sm"
            style={{
              backgroundColor: "rgba(220, 38, 38, 0.1)",
              color: "rgb(220, 38, 38)",
            }}
          >
            {error}
          </p>
        )}

        {isEditing ? (
          /* Edit mode */
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  Blood Type
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                >
                  {BLOOD_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt || "Select..."}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  Allergies
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                  placeholder="Peanuts, penicillin, etc."
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  Medications
                </label>
                <input
                  type="text"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                  placeholder="Current medications..."
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  Conditions
                </label>
                <input
                  type="text"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                  placeholder="Asthma, diabetes, etc."
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  Doctor Name
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                  placeholder="Dr. Smith"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  Doctor Phone
                </label>
                <input
                  type="tel"
                  value={doctorPhone}
                  onChange={(e) => setDoctorPhone(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  Insurance Provider
                </label>
                <input
                  type="text"
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                  placeholder="Blue Cross, Manulife, etc."
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  Policy Number
                </label>
                <input
                  type="text"
                  value={insurancePolicyNumber}
                  onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                  placeholder="Policy number..."
                />
              </div>
            </div>
            <div className="mt-3">
              <label
                className="mb-1 block text-xs font-medium"
                style={{ color: "var(--muted)" }}
              >
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                style={inputStyle}
                placeholder="Any additional medical notes..."
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: "var(--muted)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : hasData ? (
          /* View mode with data */
          <div className="grid gap-3 sm:grid-cols-2">
            {record.blood_type && (
              <InfoField label="Blood Type" value={record.blood_type} />
            )}
            {record.allergies && (
              <InfoField label="Allergies" value={record.allergies} />
            )}
            {record.medications && (
              <InfoField label="Medications" value={record.medications} />
            )}
            {record.conditions && (
              <InfoField label="Conditions" value={record.conditions} />
            )}
            {record.doctor_name && (
              <InfoField
                label="Doctor"
                value={
                  record.doctor_phone
                    ? `${record.doctor_name} (${record.doctor_phone})`
                    : record.doctor_name
                }
              />
            )}
            {record.insurance_provider && (
              <InfoField
                label="Insurance"
                value={
                  record.insurance_policy_number
                    ? `${record.insurance_provider} - ${record.insurance_policy_number}`
                    : record.insurance_provider
                }
              />
            )}
            {record.notes && (
              <div className="sm:col-span-2">
                <InfoField label="Notes" value={record.notes} />
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <p className="py-4 text-center text-sm" style={{ color: "var(--muted)" }}>
            No medical info recorded yet.
            {canEdit && " Click \"Add Info\" to get started."}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Info Field (read-only) ───

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-xs font-medium"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </p>
      <p className="mt-0.5 text-sm" style={{ color: "var(--foreground)" }}>
        {value}
      </p>
    </div>
  );
}
