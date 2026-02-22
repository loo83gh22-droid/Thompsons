"use client";

import { useMemo } from "react";
import type { OurFamilyMember, OurFamilyRelationship } from "./page";

type TreeMemberNode = {
  member: OurFamilyMember;
  spouse: OurFamilyMember | null;
  children: TreeMemberNode[];
};

function buildTree(
  members: OurFamilyMember[],
  relationships: OurFamilyRelationship[]
): TreeMemberNode[] {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const childRels = relationships.filter((r) => r.relationship_type === "child");
  const spouseRels = relationships.filter((r) => r.relationship_type === "spouse");

  const childIds = new Set(childRels.map((r) => r.member_id));

  const getSpouse = (id: string): OurFamilyMember | null => {
    const rel = spouseRels.find((r) => r.member_id === id || r.related_id === id);
    if (!rel) return null;
    const otherId = rel.member_id === id ? rel.related_id : rel.member_id;
    return memberMap.get(otherId) ?? null;
  };

  const getChildIds = (parentId: string): string[] =>
    childRels.filter((r) => r.related_id === parentId).map((r) => r.member_id);

  // Global rendered set: every member may only appear once in the entire tree.
  // This prevents ME! (and their spouse + kids) from being duplicated under
  // each parent when multiple root members (e.g. Dad, Ma) share the same child.
  const rendered = new Set<string>();

  function buildNode(memberId: string, coParentId?: string): TreeMemberNode | null {
    if (rendered.has(memberId)) return null;
    rendered.add(memberId);

    const member = memberMap.get(memberId);
    if (!member) return null;

    // Prefer a formal spouse; fall back to a co-parent (shared child, no spouse rel).
    const formalSpouse = getSpouse(memberId);
    let resolvedSpouse: OurFamilyMember | null = null;

    if (formalSpouse && !rendered.has(formalSpouse.id)) {
      rendered.add(formalSpouse.id);
      resolvedSpouse = formalSpouse;
    } else if (!formalSpouse && coParentId && !rendered.has(coParentId)) {
      rendered.add(coParentId);
      resolvedSpouse = memberMap.get(coParentId) ?? null;
    }

    // Merge children from this member and their partner.
    const myChildIds = getChildIds(memberId);
    const partnerChildIds = resolvedSpouse ? getChildIds(resolvedSpouse.id) : [];
    const allChildIds = [...new Set([...myChildIds, ...partnerChildIds])];

    const children = allChildIds
      .filter((id) => !rendered.has(id))
      .map((id) => buildNode(id))
      .filter((n): n is TreeMemberNode => n !== null);

    return { member, spouse: resolvedSpouse, children };
  }

  const roots = members
    .filter((m) => !childIds.has(m.id))
    // Sort so members with direct child relationships (real parents/grandparents)
    // are processed before members who only appear as someone else's spouse.
    // This prevents a spouse (e.g. Peach) whose name sorts first alphabetically
    // from being claimed as the root before the grandparent generation is built.
    .sort((a, b) => {
      const diff = getChildIds(b.id).length - getChildIds(a.id).length;
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });

  // Detect co-parents: two roots that share at least one child but have no formal
  // spouse relationship. Pair them so they appear side-by-side at the same level
  // instead of spawning duplicate subtrees.
  function findCoParent(rootId: string): OurFamilyMember | null {
    if (getSpouse(rootId)) return null; // already has a formal spouse
    const myChildren = new Set(getChildIds(rootId));
    if (myChildren.size === 0) return null;
    for (const other of roots) {
      if (other.id === rootId || rendered.has(other.id)) continue;
      if (getSpouse(other.id)) continue; // other has their own formal spouse
      if (getChildIds(other.id).some((c) => myChildren.has(c))) return other;
    }
    return null;
  }

  // Fallback when the whole family is one circular group (no true roots).
  if (roots.length === 0) {
    const rootNodes: TreeMemberNode[] = [];
    for (const m of members) {
      if (rendered.has(m.id)) continue;
      const node = buildNode(m.id);
      if (node) rootNodes.push(node);
    }
    return rootNodes;
  }

  const rootNodes: TreeMemberNode[] = [];
  for (const r of roots) {
    if (rendered.has(r.id)) continue;
    const coParent = findCoParent(r.id);
    const node = buildNode(r.id, coParent?.id);
    if (node) rootNodes.push(node);
  }
  return rootNodes;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function statusType(m: OurFamilyMember): "signed_in" | "pending_invitation" | "no_account" {
  if (m.user_id) return "signed_in";
  if (m.contact_email?.trim()) return "pending_invitation";
  return "no_account";
}

function StatusDot({ member }: { member: OurFamilyMember }) {
  const status = statusType(member);
  const color =
    status === "signed_in"
      ? "bg-emerald-500"
      : status === "pending_invitation"
        ? "bg-amber-500"
        : "bg-[var(--muted)]";
  return (
    <span
      className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] ${color}`}
      title={
        status === "signed_in"
          ? "Signed In"
          : status === "pending_invitation"
            ? "Pending Invitation"
            : "No account"
      }
      aria-hidden
    />
  );
}

function MemberCard({
  member,
  selected,
  onClick,
}: {
  member: OurFamilyMember;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={member.relationship ?? undefined}
      className={`flex flex-col items-center rounded-xl border-2 bg-[var(--surface)] p-3 transition-all hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        selected ? "shadow-md ring-2 ring-[var(--accent)]/30" : "shadow-sm hover:border-[var(--accent)]/50"
      }`}
      style={{
        borderColor: selected ? "var(--accent)" : "var(--border)",
        minWidth: "104px",
      }}
    >
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--accent)]/20 text-lg font-semibold text-[var(--accent)]">
            {initials(member.name)}
          </div>
        )}
        <StatusDot member={member} />
      </div>
      <span className="mt-2 max-w-[100px] truncate text-center text-sm font-semibold text-[var(--foreground)]">
        {member.nickname?.trim() || member.name}
      </span>
      {member.relationship && (
        <span className="mt-0.5 max-w-[100px] truncate text-center text-[11px] text-[var(--muted)]">
          {member.relationship}
        </span>
      )}
    </button>
  );
}

function FamilyNode({
  node,
  selectedId,
  onSelectMember,
}: {
  node: TreeMemberNode;
  selectedId: string | null;
  onSelectMember: (id: string | null) => void;
}) {
  const hasChildren = node.children.length > 0;

  return (
    <div className="ftv-node">
      {/* Couple / single row */}
      <div className="ftv-couple">
        <MemberCard
          member={node.member}
          selected={selectedId === node.member.id}
          onClick={() =>
            onSelectMember(selectedId === node.member.id ? null : node.member.id)
          }
        />
        {node.spouse && (
          <>
            <div className="ftv-spouse-line" aria-hidden />
            <MemberCard
              member={node.spouse}
              selected={selectedId === node.spouse.id}
              onClick={() =>
                onSelectMember(selectedId === node.spouse!.id ? null : node.spouse!.id)
              }
            />
          </>
        )}
      </div>

      {hasChildren && (
        <>
          {/* Vertical stem from couple down to horizontal branch */}
          <div className="ftv-stem" aria-hidden />

          {/* Children row */}
          <div className="ftv-children">
            {node.children.map((child, idx) => {
              const isOnly = node.children.length === 1;
              const isFirst = idx === 0;
              const isLast = idx === node.children.length - 1;
              const cls = [
                "ftv-child",
                isOnly ? "ftv-only" : isFirst ? "ftv-first" : isLast ? "ftv-last" : "ftv-middle",
              ].join(" ");
              return (
                <div key={child.member.id} className={cls}>
                  {/* Vertical tendril from branch down to child */}
                  <div className="ftv-tendril" aria-hidden />
                  <FamilyNode
                    node={child}
                    selectedId={selectedId}
                    onSelectMember={onSelectMember}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function FamilyTreeView({
  members,
  relationships,
  onSelectMember,
  selectedId,
}: {
  members: OurFamilyMember[];
  relationships: OurFamilyRelationship[];
  onSelectMember: (id: string | null) => void;
  selectedId: string | null;
}) {
  const rootNodes = useMemo(
    () => buildTree(members, relationships),
    [members, relationships]
  );

  return (
    <>
      <style>{`
        /* Tree layout */
        .ftv-node {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Couple pair row */
        .ftv-couple {
          display: flex;
          align-items: center;
        }

        /* Horizontal line between spouses */
        .ftv-spouse-line {
          width: 36px;
          height: 2px;
          background: var(--border);
          flex-shrink: 0;
        }

        /* Vertical stem from couple down to children branch */
        .ftv-stem {
          width: 2px;
          height: 36px;
          background: var(--border);
          flex-shrink: 0;
        }

        /* Children row */
        .ftv-children {
          display: flex;
          align-items: flex-start;
        }

        /* Each child column */
        .ftv-child {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding: 0 24px;
        }

        /* Horizontal branch line drawn above each child */
        .ftv-child::before {
          content: '';
          position: absolute;
          top: 0;
          height: 2px;
          background: var(--border);
        }

        /* First child: branch goes from center → right */
        .ftv-first::before { left: 50%; right: 0; }

        /* Last child: branch goes from left → center */
        .ftv-last::before { left: 0; right: 50%; }

        /* Middle child: full-width branch */
        .ftv-middle::before { left: 0; right: 0; }

        /* Only child: no horizontal branch (just vertical) */
        .ftv-only::before { display: none; }

        /* Vertical tendril from branch down to child card */
        .ftv-tendril {
          width: 2px;
          height: 36px;
          background: var(--border);
          flex-shrink: 0;
        }
      `}</style>

      <div className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-10">
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-10">
            {rootNodes.map((node) => (
              <FamilyNode
                key={node.member.id}
                node={node}
                selectedId={selectedId}
                onSelectMember={onSelectMember}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
