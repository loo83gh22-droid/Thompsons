import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { MemberTabs } from "../MemberTabs";
import { CurrentFavourites } from "../CurrentFavourites";
import { FavouritesHistory } from "../FavouritesHistory";
import { AddFavouriteForm } from "../AddFavouriteForm";
import Link from "next/link";
import type { FavouriteCategory } from "../actions";

const CATEGORIES: Record<string, { label: string; icon: string }> = {
  books: { label: "Books", icon: "📚" },
  movies: { label: "Movies", icon: "🎬" },
  shows: { label: "Shows", icon: "📺" },
  music: { label: "Music", icon: "🎵" },
  toys: { label: "Toys", icon: "🧸" },
  games: { label: "Games", icon: "🎮" },
};

export default async function FavouriteCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ member?: string }>;
}) {
  const { category } = await params;
  const { member: memberParam } = await searchParams;

  const cat = CATEGORIES[category];
  if (!cat) notFound();

  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  // Fetch all family members
  const { data: familyMembers } = await supabase
    .from("family_members")
    .select("id, name")
    .eq("family_id", activeFamilyId)
    .order("name");

  const members = familyMembers || [];

  // Determine selected member: URL param → first member
  const selectedMember =
    members.find((m) => m.id === memberParam) ?? members[0] ?? null;

  if (!selectedMember) {
    return (
      <div>
        <div className="mb-8">
          <Link
            href="/dashboard/favourites"
            className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            ← Favourites
          </Link>
          <h1 className="mt-2 font-display text-4xl font-bold text-[var(--foreground)]">
            <span className="mr-2">{cat.icon}</span>
            {cat.label}
          </h1>
        </div>
        <p className="text-[var(--muted)]">No family members found.</p>
      </div>
    );
  }

  // Active favourites for selected member
  const { data: activeItems } = await supabase
    .from("favourites")
    .select("id, title, description, notes, age, photo_url, created_at")
    .eq("family_id", activeFamilyId)
    .eq("category", category)
    .eq("member_id", selectedMember.id)
    .is("removed_at", null)
    .order("created_at", { ascending: false });

  // History (soft-deleted) for selected member
  const { data: historyItems } = await supabase
    .from("favourites")
    .select("id, title, description, created_at, removed_at")
    .eq("family_id", activeFamilyId)
    .eq("category", category)
    .eq("member_id", selectedMember.id)
    .not("removed_at", "is", null)
    .order("removed_at", { ascending: false });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/favourites"
          className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          ← Favourites
        </Link>
        <h1 className="mt-2 font-display text-4xl font-bold text-[var(--foreground)]">
          <span className="mr-2">{cat.icon}</span>
          {cat.label}
        </h1>
      </div>

      {/* Member selector tabs */}
      <MemberTabs
        members={members}
        selectedMemberId={selectedMember.id}
        category={category}
      />

      {/* Selected member's section */}
      <div className="mt-8">
        {/* Section heading + add button (flex-wrap lets form drop to its own line when open) */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <h2 className="flex-1 font-semibold text-[var(--foreground)]">
            {selectedMember.name}&apos;s {cat.label.toLowerCase()}
          </h2>
          <AddFavouriteForm
            category={category as FavouriteCategory}
            categoryLabel={cat.label}
            memberId={selectedMember.id}
            memberName={selectedMember.name}
          />
        </div>

        {/* Current favourites grid */}
        <CurrentFavourites
          items={activeItems || []}
          memberName={selectedMember.name}
          categoryLabel={cat.label}
        />
      </div>

      {/* History timeline */}
      <FavouritesHistory items={historyItems || []} />
    </div>
  );
}
