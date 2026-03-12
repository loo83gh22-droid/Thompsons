"use client";

import { useMemo } from "react";
import type { OurFamilyMember, OurFamilyRelationship } from "./page";

type TreeMemberNode = {
  member: OurFamilyMember;
  spouse: OurFamilyMember | null;
  /** true when spouse is a co-parent (shared child) but not formally married */
  isCoParent: boolean;
  /**
   * A co-parent who shares a child with member but is NOT member's formal
   * spouse. Rendered on the opposite side: [coParent]  [member ♥ spouse].
   * Only set when member already has a formal spouse.
   */
  coParent: OurFamilyMember | null;
  children: TreeMemberNode[];
};

type ParentCouple = { member: OurFamilyMember; spouse: OurFamilyMember | null };

/**
 * A root entry is either a single-root subtree or a "multi-parent" group —
 * two or more parent couples who share the same child (blended-family pattern).
 * Example: Dad+Brenda and Ma+Rick are both parents of ME!
 */
type RootEntry =
  | { kind: "node"; node: TreeMemberNode }
  | { kind: "multi-parent"; parentCouples: ParentCouple[]; child: TreeMemberNode };

function buildTree(
  members: OurFamilyMember[],
  relationships: OurFamilyRelationship[]
): RootEntry[] {
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
  const rendered = new Set<string>();

  function buildNode(memberId: string, coParentId?: string): TreeMemberNode | null {
    if (rendered.has(memberId)) return null;
    rendered.add(memberId);

    const member = memberMap.get(memberId);
    if (!member) return null;

    const formalSpouse = getSpouse(memberId);
    let resolvedSpouse: OurFamilyMember | null = null;
    let isCoParent = false;
    let coParent: OurFamilyMember | null = null;

    if (formalSpouse && !rendered.has(formalSpouse.id)) {
      rendered.add(formalSpouse.id);
      resolvedSpouse = formalSpouse;
      if (coParentId && !rendered.has(coParentId)) {
        rendered.add(coParentId);
        coParent = memberMap.get(coParentId) ?? null;
      }
    } else if (!formalSpouse && coParentId && !rendered.has(coParentId)) {
      rendered.add(coParentId);
      resolvedSpouse = memberMap.get(coParentId) ?? null;
      isCoParent = true;
    }

    const myChildIds = getChildIds(memberId);
    const partnerChildIds = resolvedSpouse ? getChildIds(resolvedSpouse.id) : [];
    const coParentChildIds = coParent ? getChildIds(coParent.id) : [];
    const allChildIds = [...new Set([...myChildIds, ...partnerChildIds, ...coParentChildIds])];

    const children = allChildIds
      .filter((id) => !rendered.has(id))
      .map((id) => buildNode(id))
      .filter((n): n is TreeMemberNode => n !== null);

    return { member, spouse: resolvedSpouse, isCoParent, coParent, children };
  }

  const roots = members
    .filter((m) => !childIds.has(m.id))
    .sort((a, b) => {
      const aHasGrandkids = getChildIds(a.id).some(
        (cId) => getChildIds(cId).length > 0
      );
      const bHasGrandkids = getChildIds(b.id).some(
        (cId) => getChildIds(cId).length > 0
      );
      if (aHasGrandkids !== bHasGrandkids) return aHasGrandkids ? -1 : 1;
      const diff = getChildIds(b.id).length - getChildIds(a.id).length;
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });

  function findCoParent(rootId: string): OurFamilyMember | null {
    const myChildren = new Set(getChildIds(rootId));
    if (myChildren.size === 0) return null;
    for (const other of roots) {
      if (other.id === rootId || rendered.has(other.id)) continue;
      if (getSpouse(other.id)) continue;
      if (getChildIds(other.id).some((c) => myChildren.has(c))) return other;
    }
    return null;
  }

  if (roots.length === 0) {
    const result: RootEntry[] = [];
    for (const m of members) {
      if (rendered.has(m.id)) continue;
      const node = buildNode(m.id);
      if (node) result.push({ kind: "node", node });
    }
    return result;
  }

  // ── Phase 1: Build root nodes ──────────────────────────────────────────────
  const rootNodes: TreeMemberNode[] = [];
  for (const r of roots) {
    if (rendered.has(r.id)) continue;
    const coParent = findCoParent(r.id);
    const node = buildNode(r.id, coParent?.id);
    if (node) rootNodes.push(node);
  }

  // ── Phase 2: Merge floating roots into multi-parent entries ────────────────
  // A "floating root" has 0 rendered children because its expected children
  // were already claimed by another root's subtree (blended family pattern).
  // The shared child may be the `member` OR the `spouse` of a node — we must
  // search both positions and group all floating roots that share a child.

  function findNodeById(
    node: TreeMemberNode,
    targetId: string
  ): TreeMemberNode | null {
    if (node.member.id === targetId) return node;
    for (const child of node.children) {
      const found = findNodeById(child, targetId);
      if (found) return found;
    }
    return null;
  }

  /** Like findNodeById but also checks spouse / coParent positions. */
  function findNodeByIdOrSpouse(
    node: TreeMemberNode,
    targetId: string
  ): { found: TreeMemberNode; asSpouse: boolean } | null {
    if (node.member.id === targetId) return { found: node, asSpouse: false };
    if (node.spouse?.id === targetId || node.coParent?.id === targetId)
      return { found: node, asSpouse: true };
    for (const child of node.children) {
      const result = findNodeByIdOrSpouse(child, targetId);
      if (result) return result;
    }
    return null;
  }

  function findParentNode(
    node: TreeMemberNode,
    childId: string
  ): TreeMemberNode | null {
    if (node.children.some((c) => c.member.id === childId)) return node;
    for (const child of node.children) {
      const found = findParentNode(child, childId);
      if (found) return found;
    }
    return null;
  }

  const mergedIds = new Set<string>();
  const multiParentEntries: RootEntry[] = [];

  // Group floating roots by the child they expected to own
  const childToFloating = new Map<string, TreeMemberNode[]>();
  for (const floatingRoot of rootNodes) {
    if (floatingRoot.children.length > 0) continue;
    const expectedChildIds = [
      ...getChildIds(floatingRoot.member.id),
      ...(floatingRoot.spouse ? getChildIds(floatingRoot.spouse.id) : []),
    ];
    for (const cId of expectedChildIds) {
      if (!childToFloating.has(cId)) childToFloating.set(cId, []);
      const group = childToFloating.get(cId)!;
      if (!group.some((g) => g.member.id === floatingRoot.member.id)) {
        group.push(floatingRoot);
      }
    }
  }

  for (const [sharedChildId, floatingRoots] of childToFloating) {
    if (floatingRoots.every((fr) => mergedIds.has(fr.member.id))) continue;

    // Find which root owns this shared child (check member AND spouse positions)
    let ownerRoot: TreeMemberNode | null = null;
    let targetNode: TreeMemberNode | null = null;
    let foundAsSpouse = false;

    for (const otherRoot of rootNodes) {
      if (floatingRoots.some((fr) => fr.member.id === otherRoot.member.id)) continue;
      if (mergedIds.has(otherRoot.member.id)) continue;

      const result = findNodeByIdOrSpouse(otherRoot, sharedChildId);
      if (result) {
        ownerRoot = otherRoot;
        targetNode = result.found;
        foundAsSpouse = result.asSpouse;
        break;
      }
    }

    // Also check already-created multi-parent entries
    if (!targetNode) {
      for (const entry of multiParentEntries) {
        if (entry.kind !== "multi-parent") continue;
        const result = findNodeByIdOrSpouse(entry.child, sharedChildId);
        if (result) {
          for (const fr of floatingRoots) {
            if (mergedIds.has(fr.member.id)) continue;
            entry.parentCouples.push({ member: fr.member, spouse: fr.spouse });
            mergedIds.add(fr.member.id);
          }
          targetNode = result.found;
          break;
        }
      }
      if (targetNode) continue; // folded into existing entry
      continue; // not found anywhere
    }

    const parentCouples: ParentCouple[] = [];
    let childNode: TreeMemberNode;

    if (foundAsSpouse) {
      // The shared child is the SPOUSE of targetNode.member.
      // targetNode is the couple node — detach it from its parent and promote
      // all grandparents as parentCouples above the couple.
      childNode = targetNode;

      const parentOfCouple = findParentNode(ownerRoot!, targetNode.member.id);
      if (parentOfCouple) {
        parentOfCouple.children = parentOfCouple.children.filter(
          (c) => c.member.id !== targetNode!.member.id
        );
        if (parentOfCouple.coParent) {
          parentCouples.push({ member: parentOfCouple.coParent, spouse: null });
        }
        parentCouples.push({
          member: parentOfCouple.member,
          spouse: parentOfCouple.spouse,
        });
      }
      mergedIds.add(ownerRoot!.member.id);
    } else {
      // Child found as a node member — detach it (existing behaviour)
      childNode = targetNode;

      const parentOfShared = findParentNode(ownerRoot!, sharedChildId);
      if (parentOfShared) {
        parentOfShared.children = parentOfShared.children.filter(
          (c) => c.member.id !== sharedChildId
        );
      }
      parentCouples.push({
        member: ownerRoot!.member,
        spouse: ownerRoot!.spouse,
      });
      mergedIds.add(ownerRoot!.member.id);
    }

    // Add every floating root as a parent couple
    for (const fr of floatingRoots) {
      if (mergedIds.has(fr.member.id)) continue;
      parentCouples.push({ member: fr.member, spouse: fr.spouse });
      mergedIds.add(fr.member.id);
    }

    if (parentCouples.length > 0) {
      multiParentEntries.push({
        kind: "multi-parent",
        parentCouples,
        child: childNode,
      });
    }
  }

  // ── Phase 3: Collect final entries ────────────────────────────────────────
  // Multi-parent groups first, then remaining single-root subtrees.
  const finalEntries: RootEntry[] = [...multiParentEntries];
  for (const rootNode of rootNodes) {
    if (mergedIds.has(rootNode.member.id)) continue;
    // Only include if it still has children (or is a leaf that wasn't merged)
    finalEntries.push({ kind: "node", node: rootNode });
  }

  return finalEntries;
}

// ── Deterministic pastel accent colour from a member's id ─────────────────
const MEMBER_COLORS = [
  "#3d6b5e", // forest green  (primary)
  "#c47c3a", // warm amber    (accent)
  "#6b5ea8", // soft purple
  "#2e7da6", // ocean blue
  "#a85e6b", // dusty rose
  "#5e8c3a", // olive
];
function memberColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return MEMBER_COLORS[h % MEMBER_COLORS.length];
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
  const accentColor = memberColor(member.id);
  return (
    <button
      type="button"
      onClick={onClick}
      title={member.relationship ?? undefined}
      className={`group flex flex-col items-center rounded-xl border bg-[var(--surface)] p-3 transition-all duration-150 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        selected ? "shadow-lg scale-[1.03]" : "shadow-sm hover:scale-[1.02]"
      }`}
      style={{
        borderColor: selected ? accentColor : "var(--border)",
        borderWidth: selected ? 2 : 1,
        minWidth: "104px",
        boxShadow: selected ? `0 0 0 3px ${accentColor}22, 0 4px 12px rgba(0,0,0,0.1)` : undefined,
      }}
    >
      {/* Avatar */}
      <div
        className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full transition-all"
        style={{ outline: `2px solid ${accentColor}44`, outlineOffset: 2 }}
      >
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-lg font-bold"
            style={{ backgroundColor: accentColor + "28", color: accentColor }}
          >
            {initials(member.name)}
          </div>
        )}
        <StatusDot member={member} />
      </div>

      {/* Name */}
      <span className="mt-2 max-w-[100px] truncate text-center text-sm font-semibold text-[var(--foreground)]">
        {member.nickname?.trim() || member.name}
      </span>

      {/* Relationship label */}
      {member.relationship && (
        <span
          className="mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: accentColor + "18", color: accentColor }}
        >
          {member.relationship}
        </span>
      )}
    </button>
  );
}

/** Renders a couple pair (member + optional spouse/co-parent line) */
function CoupleRow({
  couple,
  selectedId,
  onSelectMember,
}: {
  couple: ParentCouple;
  selectedId: string | null;
  onSelectMember: (id: string | null) => void;
}) {
  return (
    <div className="ftv-couple">
      <MemberCard
        member={couple.member}
        selected={selectedId === couple.member.id}
        onClick={() =>
          onSelectMember(selectedId === couple.member.id ? null : couple.member.id)
        }
      />
      {couple.spouse && (
        <>
          <div className="ftv-spouse-line" aria-hidden>
            <span className="ftv-heart" aria-hidden>♥</span>
          </div>
          <MemberCard
            member={couple.spouse}
            selected={selectedId === couple.spouse.id}
            onClick={() =>
              onSelectMember(selectedId === couple.spouse!.id ? null : couple.spouse!.id)
            }
          />
        </>
      )}
    </div>
  );
}

/**
 * Renders a multi-parent group: two or more parent couples side-by-side
 * above their shared child, with convergence lines connecting them.
 *
 *   [Dad ♥ Brenda]    [Ma ♥ Rick]
 *         |                |
 *         └────────┬────────┘
 *                  |
 *           [ME! ♥ Jodi]
 *            /          \
 *        [Huck]        [Maui]
 */
function MultiParentView({
  entry,
  selectedId,
  onSelectMember,
}: {
  entry: { kind: "multi-parent"; parentCouples: ParentCouple[]; child: TreeMemberNode };
  selectedId: string | null;
  onSelectMember: (id: string | null) => void;
}) {
  const { parentCouples, child } = entry;
  const count = parentCouples.length;

  return (
    <div className="ftv-node">
      {/* Parent couples row with convergence lines below */}
      <div className="ftv-multi-parents">
        {parentCouples.map((pc, idx) => {
          const isOnly = count === 1;
          const isFirst = idx === 0;
          const isLast = idx === count - 1;
          const pos = isOnly
            ? "ftv-punit-only"
            : isFirst
              ? "ftv-punit-first"
              : isLast
                ? "ftv-punit-last"
                : "ftv-punit-middle";
          return (
            <div key={pc.member.id} className={`ftv-punit-wrapper ${pos}`}>
              <CoupleRow
                couple={pc}
                selectedId={selectedId}
                onSelectMember={onSelectMember}
              />
              {/* Vertical tendril from couple down to the horizontal convergence bar */}
              <div className="ftv-punit-tendril" aria-hidden />
            </div>
          );
        })}
      </div>

      {/* Center vertical drop from convergence point down to shared child */}
      <div className="ftv-stem" aria-hidden />

      {/* Shared child subtree */}
      <FamilyNode
        node={child}
        selectedId={selectedId}
        onSelectMember={onSelectMember}
      />
    </div>
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
      {/* Couple / single row.
           Layout: [coParent?] [gap] [member] [♥/gap] [spouse?]
           coParent = biological co-parent who is NOT member's formal spouse */}
      <div className="ftv-couple">
        {node.coParent && (
          <>
            <MemberCard
              member={node.coParent}
              selected={selectedId === node.coParent.id}
              onClick={() =>
                onSelectMember(selectedId === node.coParent!.id ? null : node.coParent!.id)
              }
            />
            <div className="ftv-coparent-gap" aria-hidden />
          </>
        )}
        <MemberCard
          member={node.member}
          selected={selectedId === node.member.id}
          onClick={() =>
            onSelectMember(selectedId === node.member.id ? null : node.member.id)
          }
        />
        {node.spouse && (
          <>
            {node.isCoParent ? (
              /* Co-parents share a child but are not married — no heart connector */
              <div className="ftv-coparent-gap" aria-hidden />
            ) : (
              <div className="ftv-spouse-line" aria-hidden>
                <span className="ftv-heart" aria-hidden>♥</span>
              </div>
            )}
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
  const rootEntries = useMemo(
    () => buildTree(members, relationships),
    [members, relationships]
  );

  return (
    <>
      <style>{`
        /* ── Tree connector colour ───────────────────────────────────────── */
        :root { --ftv-line: color-mix(in srgb, var(--foreground) 22%, transparent); }

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

        /* Plain gap between co-parents (no marriage indicator) */
        .ftv-coparent-gap {
          width: 24px;
          flex-shrink: 0;
        }

        /* Horizontal line + heart between spouses */
        .ftv-spouse-line {
          position: relative;
          width: 44px;
          height: 2px;
          background: var(--ftv-line);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ftv-heart {
          position: absolute;
          font-size: 10px;
          line-height: 1;
          color: var(--accent);
          background: var(--surface);
          padding: 0 2px;
          user-select: none;
        }

        /* Vertical stem from couple down to children branch */
        .ftv-stem {
          width: 2px;
          height: 40px;
          background: var(--ftv-line);
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
          padding: 0 20px;
        }

        /* Horizontal branch line drawn above each child */
        .ftv-child::before {
          content: '';
          position: absolute;
          top: 0;
          height: 2px;
          background: var(--ftv-line);
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
          background: var(--ftv-line);
          flex-shrink: 0;
        }

        /* ── Multi-parent layout ─────────────────────────────────────────── */

        /* Row of parent couples sitting side by side */
        .ftv-multi-parents {
          display: flex;
          align-items: flex-start;
        }

        /* Each parent couple wrapper — mirrors ftv-child but for parent generation */
        .ftv-punit-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding: 0 24px;
        }

        /* Horizontal convergence bar at the BOTTOM of each wrapper
           (drawn level with the bottom of .ftv-punit-tendril).
           Pattern mirrors ftv-child::before but applied below each couple. */
        .ftv-punit-wrapper::before {
          content: '';
          position: absolute;
          bottom: 0;
          height: 2px;
          background: var(--ftv-line);
        }

        /* Left couple: bar extends rightward from center toward sibling */
        .ftv-punit-first::before  { left: 50%; right: 0; }

        /* Right couple: bar extends leftward from center toward sibling */
        .ftv-punit-last::before   { left: 0; right: 50%; }

        /* Middle couples: full-width bar */
        .ftv-punit-middle::before { left: 0; right: 0; }

        /* Single parent (no convergence bar needed) */
        .ftv-punit-only::before   { display: none; }

        /* Vertical tendril from each couple card down to the convergence bar */
        .ftv-punit-tendril {
          width: 2px;
          height: 36px;
          background: var(--ftv-line);
          flex-shrink: 0;
        }
      `}</style>

      <div
        className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-10"
        style={{
          backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-10">
            {rootEntries.map((entry) =>
              entry.kind === "multi-parent" ? (
                <MultiParentView
                  key={entry.parentCouples[0].member.id}
                  entry={entry}
                  selectedId={selectedId}
                  onSelectMember={onSelectMember}
                />
              ) : (
                <FamilyNode
                  key={entry.node.member.id}
                  node={entry.node}
                  selectedId={selectedId}
                  onSelectMember={onSelectMember}
                />
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
