"use client";

import { useState, useEffect } from "react";
import { MemberList } from "../members/MemberList";
import { FamilyTreeView } from "./FamilyTreeView";
import { MemberDetailsPanel } from "./MemberDetailsPanel";
import type { OurFamilyMember } from "./page";
import type { OurFamilyRelationship } from "./page";
import type { MemberActivity } from "./page";

const VIEW_KEY = "our-family-view";

type View = "tree" | "list";

export function OurFamilyClient({
  members,
  relationships,
  activityByMember,
}: {
  members: OurFamilyMember[];
  relationships: OurFamilyRelationship[];
  activityByMember: Record<string, MemberActivity>;
}) {
  const [view, setView] = useState<View>("tree");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY) as View | null;
      if (saved === "tree" || saved === "list") setView(saved);
    } catch {
      // ignore
    }
  }, []);

  function handleViewChange(v: View) {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // ignore
    }
  }

  if (!members.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-4 py-12 text-center">
        <span className="text-5xl" role="img" aria-hidden>
          👨‍👩‍👧‍👦
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold text-[var(--foreground)]">
          Your family tree will grow here
        </h2>
        <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
          Add your first family member to get started
        </p>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Use &quot;+ Add member&quot; above to add your first family member.
        </p>
      </div>
    );
  }

  const selectedMember = selectedMemberId ? members.find((m) => m.id === selectedMemberId) ?? null : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--muted)]">View:</span>
        <div className="flex rounded-lg border border-[var(--border)] p-0.5">
          <button
            type="button"
            onClick={() => handleViewChange("tree")}
            className={`min-h-[40px] rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === "tree"
                ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            }`}
          >
            Tree View
          </button>
          <button
            type="button"
            onClick={() => handleViewChange("list")}
            className={`min-h-[40px] rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === "list"
                ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            }`}
          >
            List View
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className={`min-w-0 flex-1 ${selectedMember ? "lg:max-w-[calc(100%-340px)]" : ""}`}>
          {view === "tree" ? (
            <FamilyTreeView
              members={members}
              relationships={relationships}
              onSelectMember={setSelectedMemberId}
              selectedId={selectedMemberId}
            />
          ) : (
            <MemberList members={members as Parameters<typeof MemberList>[0]["members"]} />
          )}
        </div>
        {selectedMember && (
          <MemberDetailsPanel
            member={selectedMember}
            members={members}
            relationships={relationships}
            activity={activityByMember[selectedMember.id]}
            onClose={() => setSelectedMemberId(null)}
          />
        )}
      </div>
    </div>
  );
}
