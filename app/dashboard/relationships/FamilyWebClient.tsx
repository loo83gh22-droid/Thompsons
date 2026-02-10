"use client";

import { useState } from "react";
import Link from "next/link";
import type { FamilyMemberRow, RelationshipRow } from "./page";

type Props = {
  members: FamilyMemberRow[];
  relationships: RelationshipRow[];
};

export function FamilyWebClient({ members, relationships }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const getRelated = (memberId: string) => {
    const out: { member: FamilyMemberRow; label: string }[] = [];
    for (const r of relationships) {
      if (r.member_id === memberId) {
        const other = memberMap.get(r.related_id);
        if (other) out.push({ member: other, label: r.relationship_type });
      }
      if (r.related_id === memberId) {
        const other = memberMap.get(r.member_id);
        if (other) out.push({ member: other, label: r.relationship_type === "child" ? "parent" : r.relationship_type === "parent" ? "child" : r.relationship_type });
      }
    }
    return out;
  };

  const selected = selectedId ? memberMap.get(selectedId) : null;
  const related = selectedId ? getRelated(selectedId) : [];

  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedId((id) => (id === m.id ? null : m.id))}
            className={`flex flex-col items-center rounded-xl border-2 bg-[var(--surface)] p-4 transition-all hover:border-[var(--accent)]/50 ${
              selectedId === m.id ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30" : "border-[var(--border)]"
            }`}
            style={selectedId === m.id ? { borderColor: "var(--accent)" } : { borderColor: `${m.color}50` }}
          >
            <div
              className="h-12 w-12 rounded-full flex-shrink-0"
              style={{ backgroundColor: m.color }}
            />
            <span className="mt-2 truncate w-full text-center text-sm font-medium text-[var(--foreground)]">
              {m.name}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">{selected.name}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Relationships</p>
          {related.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">No relationships added yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {related.map(({ member, label }) => (
                <li key={member.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full flex-shrink-0" style={{ backgroundColor: member.color }} />
                    <span className="text-sm font-medium text-[var(--foreground)]">{member.name}</span>
                  </div>
                  <span className="text-xs uppercase text-[var(--muted)]">{label}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/dashboard/timeline?member=${selected.id}`}
            className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
          >
            View their contributions on Timeline →
          </Link>
        </div>
      )}

      <p className="mt-6 text-sm text-[var(--muted)]">
        Tip: Add and edit relationships in the Family Tree section. This view shows the same connections in a web layout.
      </p>
    </div>
  );
}
