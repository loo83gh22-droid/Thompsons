import { createClient } from "@/src/lib/supabase/server";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getActiveFamilyId } from "@/src/lib/family";

type FamilyMember = {
  id: string;
  name: string;
  color: string;
};

type Relationship = {
  member_id: string;
  related_id: string;
  relationship_type: string;
};

export default async function FamilyTreePage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name, color")
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

  const spouses = rels.filter((r) => r.relationship_type === "spouse");
  const children = rels.filter((r) => r.relationship_type === "child");

  const parentIds = new Set<string>();
  children.forEach((r) => parentIds.add(r.related_id));
  const childIds = new Set<string>();
  children.forEach((r) => childIds.add(r.member_id));

  const parents = Array.from(parentIds)
    .map((id) => memberMap.get(id))
    .filter(Boolean) as FamilyMember[];

  const kids = Array.from(childIds)
    .map((id) => memberMap.get(id))
    .filter(Boolean) as FamilyMember[];

  const getSpouse = (id: string) => {
    const s = spouses.find((r) => r.member_id === id);
    return s ? memberMap.get(s.related_id) : null;
  };

  const getChildren = (parentId: string) =>
    children
      .filter((r) => r.related_id === parentId)
      .map((r) => memberMap.get(r.member_id))
      .filter(Boolean) as FamilyMember[];

  const uniqueParents = parents.filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        Family Tree
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        The Thompsons. Parents, children, and how we connect.
      </p>

      <div className="mt-12">
        {uniqueParents.length === 0 && kids.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
            <p className="text-[var(--muted)]">
              No family relationships yet. Run migration 010 to seed the tree.
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Dad, Mom, Huck, and Maui will appear once the migration is applied.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Parents row */}
            <div className="flex flex-wrap justify-center gap-6">
              {uniqueParents.map((parent) => {
                const spouse = getSpouse(parent.id);
                return (
                  <div key={parent.id} className="flex items-center gap-4">
                    <PersonCard member={parent} />
                    {spouse && (
                      <>
                        <div className="hidden h-px w-8 bg-[var(--border)] sm:block" />
                        <PersonCard member={spouse} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Connector line */}
            {kids.length > 0 && (
              <div className="my-4 h-8 w-px bg-[var(--border)]" />
            )}

            {/* Children row */}
            {kids.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6">
                {kids.map((child) => (
                  <PersonCard key={child.id} member={child} />
                ))}
              </div>
            )}
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
                  <span>{m.name}</span>
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

function PersonCard({ member }: { member: FamilyMember }) {
  const shortName = member.name.split("(")[0].trim();
  return (
    <div
      className="flex flex-col items-center rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]/50"
      style={{ borderColor: `${member.color}40` }}
    >
      <div
        className="mb-3 h-12 w-12 rounded-full"
        style={{ backgroundColor: member.color }}
      />
      <p className="font-display text-lg font-semibold text-[var(--foreground)]">
        {shortName}
      </p>
      <p className="mt-1 text-sm text-[var(--muted)]">{member.name}</p>
    </div>
  );
}
