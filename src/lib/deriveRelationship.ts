/**
 * Viewer-relative relationship derivation.
 *
 * Given a viewer (the logged-in user's family_member id) and a target member,
 * walks the family tree to compute what the target member "is" from the viewer's
 * perspective.  Only returns a value when the derived label adds information —
 * e.g. "Father-in-Law" for Jodi viewing Rob's father John.
 *
 * The `relationship_type` values in `family_relationships` are:
 *   "child"  — member_id is a child of related_id
 *   "spouse" — member_id is a spouse of related_id (stored bidirectionally)
 */

type RelLink = {
  member_id: string;
  related_id: string;
  relationship_type: string;
};

type MemberStub = {
  id: string;
  relationship: string | null;
};

// ── Tree traversal helpers ───────────────────────────────────────────────────

function getParents(id: string, rels: RelLink[]): string[] {
  return rels
    .filter((r) => r.member_id === id && r.relationship_type === "child")
    .map((r) => r.related_id);
}

function getChildren(id: string, rels: RelLink[]): string[] {
  return rels
    .filter((r) => r.related_id === id && r.relationship_type === "child")
    .map((r) => r.member_id);
}

function getSpouse(id: string, rels: RelLink[]): string | null {
  return (
    rels.find((r) => r.member_id === id && r.relationship_type === "spouse")
      ?.related_id ?? null
  );
}

function getSiblings(id: string, rels: RelLink[]): string[] {
  const parents = getParents(id, rels);
  if (!parents.length) return [];
  const set = new Set<string>();
  for (const p of parents) {
    for (const c of getChildren(p, rels)) {
      if (c !== id) set.add(c);
    }
  }
  return [...set];
}

// ── Gender inference from the stored relationship label ──────────────────────

function genderOf(label: string | null): "male" | "female" | "unknown" {
  const l = (label ?? "").toLowerCase();
  if (
    /\b(father|son|brother|grandfather|grandson|uncle|nephew|stepfather|stepbrother)\b/.test(
      l
    )
  )
    return "male";
  if (
    /\b(mother|daughter|sister|grandmother|granddaughter|aunt|niece|stepmother|stepsister)\b/.test(
      l
    )
  )
    return "female";
  return "unknown";
}

// ── Core derivation ──────────────────────────────────────────────────────────

/**
 * Returns a viewer-relative relationship label for `targetId`, or `null`
 * when the original label is already correct (direct relationships) or when
 * no path through the tree connects the two members.
 */
export function deriveRelationshipLabel(
  viewerId: string,
  targetId: string,
  relationships: RelLink[],
  members: MemberStub[]
): string | null {
  if (viewerId === targetId) return null;

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const targetOriginal = memberMap.get(targetId)?.relationship ?? null;
  const g = genderOf(targetOriginal);

  const mySpouse = getSpouse(viewerId, relationships);
  const myParents = getParents(viewerId, relationships);
  const myChildren = getChildren(viewerId, relationships);
  const mySiblings = getSiblings(viewerId, relationships);

  // Direct relationships — the original label is already from the viewer's
  // perspective (or close enough), so don't override.
  if (mySpouse === targetId) return null;
  if (myParents.includes(targetId)) return null;
  if (myChildren.includes(targetId)) return null;
  if (mySiblings.includes(targetId)) return null;

  // ── Spouse's relatives ──────────────────────────────────────────────────
  if (mySpouse) {
    // Spouse's parents → in-laws
    const spouseParents = getParents(mySpouse, relationships);
    if (spouseParents.includes(targetId)) {
      if (g === "male") return "Father-in-law";
      if (g === "female") return "Mother-in-law";
      return "Parent-in-Law";
    }

    // Spouse's siblings → siblings-in-law
    const spouseSiblings = getSiblings(mySpouse, relationships);
    if (spouseSiblings.includes(targetId)) {
      if (g === "male") return "Brother-in-Law";
      if (g === "female") return "Sister-in-Law";
      return "Sibling-in-Law";
    }
  }

  // ── My children's spouses → children-in-law ─────────────────────────────
  for (const childId of myChildren) {
    const childSpouse = getSpouse(childId, relationships);
    if (childSpouse === targetId) {
      if (g === "male") return "Son-in-Law";
      if (g === "female") return "Daughter-in-Law";
      return "Child-in-Law";
    }
  }

  // ── Grandparents (parents' parents) ─────────────────────────────────────
  for (const parentId of myParents) {
    const grandparents = getParents(parentId, relationships);
    if (grandparents.includes(targetId)) {
      if (g === "male") return "Grandfather";
      if (g === "female") return "Grandmother";
      return "Grandparent";
    }
  }

  // ── Grandchildren (children's children) ─────────────────────────────────
  for (const childId of myChildren) {
    const grandchildren = getChildren(childId, relationships);
    if (grandchildren.includes(targetId)) {
      if (g === "male") return "Grandson";
      if (g === "female") return "Granddaughter";
      return "Grandchild";
    }
  }

  // ── Aunts / Uncles (parents' siblings) ──────────────────────────────────
  for (const parentId of myParents) {
    const parentSiblings = getSiblings(parentId, relationships);
    if (parentSiblings.includes(targetId)) {
      if (g === "male") return "Uncle";
      if (g === "female") return "Aunt";
      return "Aunt/Uncle";
    }
  }

  // ── Nieces / Nephews (siblings' children) ───────────────────────────────
  for (const siblingId of mySiblings) {
    const siblingChildren = getChildren(siblingId, relationships);
    if (siblingChildren.includes(targetId)) {
      if (g === "male") return "Nephew";
      if (g === "female") return "Niece";
      return "Niece/Nephew";
    }
  }

  // ── Step-parent (parent's spouse who isn't already my parent) ───────────
  for (const parentId of myParents) {
    const parentSpouse = getSpouse(parentId, relationships);
    if (parentSpouse === targetId && !myParents.includes(targetId)) {
      if (g === "male") return "Stepfather";
      if (g === "female") return "Stepmother";
      return "Step-Parent";
    }
  }

  // ── Step-siblings (parent's spouse's other children) ────────────────────
  for (const parentId of myParents) {
    const parentSpouse = getSpouse(parentId, relationships);
    if (parentSpouse) {
      const stepSiblings = getChildren(parentSpouse, relationships).filter(
        (c) => c !== viewerId && !mySiblings.includes(c)
      );
      if (stepSiblings.includes(targetId)) {
        if (g === "male") return "Stepbrother";
        if (g === "female") return "Stepsister";
        return "Step-Sibling";
      }
    }
  }

  return null; // No path found — fall back to the original label
}

// ── Map builder ──────────────────────────────────────────────────────────────

/**
 * Builds a complete viewer-relative override map for all family members.
 * Only includes entries where the derived label differs from the original
 * (i.e. where it adds new information for this viewer).
 */
export function buildDerivedRelationshipMap(
  viewerId: string,
  relationships: RelLink[],
  members: MemberStub[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const m of members) {
    if (m.id === viewerId) continue;
    const derived = deriveRelationshipLabel(viewerId, m.id, relationships, members);
    if (derived) map[m.id] = derived;
  }
  return map;
}
