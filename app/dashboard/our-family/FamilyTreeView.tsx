"use client";

import { useMemo } from "react";
import { Tree, TreeNode } from "react-organizational-chart";
import type { OurFamilyMember } from "./page";
import type { OurFamilyRelationship } from "./page";

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

  const parentIds = new Set(childRels.map((r) => r.related_id));
  const childIds = new Set(childRels.map((r) => r.member_id));

  const getSpouse = (id: string): OurFamilyMember | null => {
    const rel = spouseRels.find((r) => r.member_id === id || r.related_id === id);
    if (!rel) return null;
    const otherId = rel.member_id === id ? rel.related_id : rel.member_id;
    return memberMap.get(otherId) ?? null;
  };

  const getChildIds = (parentId: string): string[] =>
    childRels.filter((r) => r.related_id === parentId).map((r) => r.member_id);

  function buildNode(memberId: string): TreeMemberNode {
    const member = memberMap.get(memberId);
    if (!member) return { member: members[0], spouse: null, children: [] };
    const spouse = getSpouse(memberId);
    const childIdsForThis = getChildIds(memberId);
    if (spouse) {
      const spouseChildIds = getChildIds(spouse.id);
      const allChildIds = [...new Set([...childIdsForThis, ...spouseChildIds])];
      const children = allChildIds.map((id) => buildNode(id)).filter((n) => n.member.id !== memberId && n.member.id !== spouse?.id);
      return { member, spouse, children };
    }
    const children = childIdsForThis.map((id) => buildNode(id));
    return { member, spouse: null, children };
  }

  const roots = members.filter((m) => !childIds.has(m.id));
  if (roots.length === 0) {
    const seen = new Set<string>();
    const rootNodes: TreeMemberNode[] = [];
    for (const m of members) {
      if (seen.has(m.id)) continue;
      const spouse = getSpouse(m.id);
      if (spouse) seen.add(spouse.id);
      seen.add(m.id);
      rootNodes.push({ member: m, spouse, children: [] });
    }
    return rootNodes;
  }

  const seen = new Set<string>();
  const rootNodes: TreeMemberNode[] = [];
  for (const r of roots) {
    if (seen.has(r.id)) continue;
    const spouse = getSpouse(r.id);
    if (spouse) seen.add(spouse.id);
    seen.add(r.id);
    rootNodes.push(buildNode(r.id));
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
  // No dot for "just listed" members — they're remembered, not incomplete
  if (status === "no_account") return null;
  return (
    <span
      className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] ${
        status === "signed_in"
          ? "bg-emerald-500 animate-pulse"
          : "bg-amber-400"
      }`}
      title={status === "signed_in" ? "Active in the app" : "Invite sent — waiting to join"}
      aria-hidden
    />
  );
}

function MemberNode({
  member,
  selected,
  onClick,
  title,
}: {
  member: OurFamilyMember;
  selected: boolean;
  onClick: () => void;
  title?: string;
}) {
  const status = statusType(member);

  // Avatar ring colour communicates membership state at a glance
  const avatarRing =
    status === "signed_in"
      ? "ring-2 ring-emerald-400 shadow-emerald-400/20 shadow-md"
      : status === "pending_invitation"
        ? "ring-2 ring-amber-400 ring-offset-1"
        : "ring-1 ring-[var(--border)]";

  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? member.relationship ?? undefined}
      className={`flex flex-col items-center rounded-xl border-2 bg-[var(--surface)] p-2 shadow-md transition-all hover:border-[var(--accent)]/50 hover:shadow-lg focus:outline focus:ring-2 focus:ring-[var(--accent)] ${
        selected ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30" : "border-[var(--border)]"
      }`}
    >
      <div className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full ${avatarRing}`}>
        {member.avatar_url ? (
          <img src={member.avatar_url} alt={member.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center text-xl font-semibold ${
            status === "signed_in"
              ? "bg-emerald-500/20 text-emerald-600"
              : status === "pending_invitation"
                ? "bg-amber-400/20 text-amber-600"
                : "bg-[var(--accent)]/20 text-[var(--accent)]"
          }`}>
            {initials(member.name)}
          </div>
        )}
        <StatusDot member={member} />
      </div>
      <span className="mt-1.5 max-w-[100px] truncate text-center text-sm font-medium text-[var(--foreground)]">
        {member.nickname?.trim() || member.name}
      </span>
    </button>
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
  const rootNodes = useMemo(() => buildTree(members, relationships), [members, relationships]);

  function renderNodeLabel(node: TreeMemberNode): React.ReactNode {
    return node.spouse ? (
      <div className="flex items-center gap-3">
        <MemberNode
          member={node.member}
          selected={selectedId === node.member.id}
          onClick={() => onSelectMember(selectedId === node.member.id ? null : node.member.id)}
          title={node.member.relationship ?? undefined}
        />
        <div className="h-0.5 w-6 flex-shrink-0 rounded bg-[var(--border)]" title="Spouse" aria-hidden />
        <MemberNode
          member={node.spouse}
          selected={selectedId === node.spouse.id}
          onClick={() => onSelectMember(selectedId === node.spouse!.id ? null : node.spouse!.id)}
          title={node.spouse.relationship ?? undefined}
        />
      </div>
    ) : (
      <MemberNode
        member={node.member}
        selected={selectedId === node.member.id}
        onClick={() => onSelectMember(selectedId === node.member.id ? null : node.member.id)}
        title={node.member.relationship ?? undefined}
      />
    );
  }

  function renderTreeNode(node: TreeMemberNode): React.ReactNode {
    if (node.children.length === 0) {
      return <TreeNode key={node.member.id} label={renderNodeLabel(node)} />;
    }
    return (
      <TreeNode key={node.member.id} label={renderNodeLabel(node)}>
        {node.children.map((child) => renderTreeNode(child))}
      </TreeNode>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 [&_.org-chart]:!flex [&_.org-chart]:justify-center [&_.org-chart]:!gap-8">
      <Tree
        label={<div className="hidden" />}
        lineHeight="24px"
        lineWidth="2px"
        lineColor="var(--border)"
        lineStyle="solid"
        nodePadding="16px"
      >
        {rootNodes.map((node) => renderTreeNode(node))}
      </Tree>
    </div>
  );
}
