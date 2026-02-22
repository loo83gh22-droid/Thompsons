import { createClient } from "@/src/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { getActiveFamilyId } from "@/src/lib/family";

type FamilyMember = {
  id: string;
  name: string;
  nickname: string | null;
  color: string;
  avatar_url: string | null;
};

type Relationship = {
  member_id: string;
  related_id: string;
  relationship_type: string;
};

type FamilyUnit = { person: FamilyMember; spouse: FamilyMember | null };

export default async function FamilyTreePage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name, nickname, color, avatar_url")
    .eq("family_id", activeFamilyId)
    .not("name", "eq", "Family")
    .order("name");

  const { data: relationships } = await supabase
    .from("family_relationships")
    .select("member_id, related_id, relationship_type")
    .eq("family_id", activeFamilyId);

  const memberMap = new Map<string, FamilyMember>();
  (members || []).forEach((m) => memberMap.set(m.id, m));

  const rels = (relationships || []) as Relationship[];
  const spouseRels = rels.filter((r) => r.relationship_type === "spouse");
  const childRels = rels.filter((r) => r.relationship_type === "child");

  // Build parent→children and child→parents adjacency maps
  const parentToChildren = new Map<string, Set<string>>();
  const childToParents = new Map<string, Set<string>>();
  childRels.forEach((r) => {
    if (!parentToChildren.has(r.related_id))
      parentToChildren.set(r.related_id, new Set());
    parentToChildren.get(r.related_id)!.add(r.member_id);

    if (!childToParents.has(r.member_id))
      childToParents.set(r.member_id, new Set());
    childToParents.get(r.member_id)!.add(r.related_id);
  });

  // Build spouse map (member → spouse)
  const spouseOf = new Map<string, string>();
  spouseRels.forEach((r) => spouseOf.set(r.member_id, r.related_id));

  // BFS to assign generation numbers
  // Roots = members with no parents in this family
  const allIds = Array.from(memberMap.keys());
  const hasParent = new Set(childToParents.keys());
  const generationOf = new Map<string, number>();

  const bfsQueue: string[] = [];
  allIds.forEach((id) => {
    if (!hasParent.has(id)) {
      generationOf.set(id, 0);
      bfsQueue.push(id);
    }
  });

  // Also seed spouses of roots at same generation
  // (a root's spouse who appears as a root themselves is already handled above)

  while (bfsQueue.length > 0) {
    const id = bfsQueue.shift()!;
    const gen = generationOf.get(id)!;
    const kids = parentToChildren.get(id) ?? new Set<string>();
    kids.forEach((childId) => {
      const existing = generationOf.get(childId) ?? -1;
      if (existing < gen + 1) {
        generationOf.set(childId, gen + 1);
        bfsQueue.push(childId);
      }
    });
  }

  // Assign generation 0 to any unassigned member (no relationships at all)
  allIds.forEach((id) => {
    if (!generationOf.has(id)) generationOf.set(id, 0);
  });

  // Group members by generation
  const maxGen = Math.max(0, ...Array.from(generationOf.values()));
  const byGeneration: FamilyMember[][] = Array.from(
    { length: maxGen + 1 },
    () => []
  );
  generationOf.forEach((gen, id) => {
    const member = memberMap.get(id);
    if (member) byGeneration[gen].push(member);
  });

  // Within each generation, pair spouses side-by-side
  const buildUnits = (gen: FamilyMember[]): FamilyUnit[] => {
    const seen = new Set<string>();
    const units: FamilyUnit[] = [];
    gen.forEach((m) => {
      if (seen.has(m.id)) return;
      seen.add(m.id);
      const spouseId = spouseOf.get(m.id);
      const spouseInGen = spouseId
        ? gen.find((x) => x.id === spouseId)
        : undefined;
      if (spouseInGen && !seen.has(spouseInGen.id)) {
        seen.add(spouseInGen.id);
        units.push({ person: m, spouse: spouseInGen });
      } else {
        units.push({ person: m, spouse: null });
      }
    });
    return units;
  };

  const noTree = generationOf.size === 0;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        Family Tree
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        The Thompsons. Parents, children, and how we connect.
      </p>

      <div className="mt-12">
        {noTree ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col items-center">
            {byGeneration.map((gen, i) => {
              if (gen.length === 0) return null;
              const units = buildUnits(gen);
              return (
                <div key={i} className="flex flex-col items-center">
                  {i > 0 && (
                    <div className="my-4 h-8 w-px bg-[var(--border)]" />
                  )}
                  <div className="flex flex-wrap justify-center gap-6">
                    {units.map((u) => (
                      <div key={u.person.id} className="flex items-center gap-4">
                        <PersonCard member={u.person} />
                        {u.spouse && (
                          <>
                            <div className="hidden h-px w-8 bg-[var(--border)] sm:block" />
                            <PersonCard member={u.spouse} />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
          All family members
        </h2>
        <ul className="mt-4 space-y-2">
          {(members || [])
            .filter((m) => m.name !== "Family")
            .map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: m.color }}
                  />
                  <span>{m.nickname || m.name.split("(")[0].trim()}</span>
                </div>
                <Link
                  href="/dashboard/map"
                  className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--accent)]"
                >
                  <MapPin className="h-4 w-4" />
                  View on Family Map
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-full max-w-lg rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-5 py-10 text-center sm:px-8 sm:py-12">
        <span className="text-5xl" role="img" aria-hidden="true">
          &#x1F333;
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold text-[var(--accent)]">
          Your family tree starts here
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
          Once you add family members and set up their relationships, your tree
          will grow right before your eyes.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/our-family"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--background)] transition-colors hover:bg-[var(--accent)]/90"
          >
            Add Family Members
          </Link>
        </div>
      </div>
    </div>
  );
}

function PersonCard({ member }: { member: FamilyMember }) {
  const displayName =
    member.nickname || member.name.split("(")[0].trim();
  const showFullName =
    displayName !== member.name.split("(")[0].trim() ||
    (member.nickname && member.nickname !== member.name.split("(")[0].trim());

  return (
    <div
      className="flex flex-col items-center rounded-xl border-2 bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]/50"
      style={{ borderColor: `${member.color}40` }}
    >
      <div
        className="mb-3 h-14 w-14 overflow-hidden rounded-full flex-shrink-0"
        style={{ backgroundColor: member.color }}
      >
        {member.avatar_url && (
          <Image
            src={member.avatar_url}
            alt={displayName}
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <p className="font-display text-lg font-semibold text-[var(--foreground)]">
        {displayName}
      </p>
      {showFullName && (
        <p className="mt-1 text-xs text-[var(--muted)]">
          {member.name.split("(")[0].trim()}
        </p>
      )}
    </div>
  );
}
