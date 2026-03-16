import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";

const CATEGORIES = [
  { id: "books", label: "Books", icon: "📚" },
  { id: "movies", label: "Movies", icon: "🎬" },
  { id: "shows", label: "Shows", icon: "📺" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "toys", label: "Toys", icon: "🧸" },
  { id: "games", label: "Games", icon: "🎮" },
] as const;

export const metadata = { title: "Favourites | Family Nest" };

export default async function FavouritesPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);

  // Fetch active favourite counts per category + titles for previews
  const countsByCategory: Record<string, number> = {};
  const memberCountsByCategory: Record<string, number> = {};
  const previewsByCategory: Record<string, string[]> = {};

  if (activeFamilyId) {
    const { data } = await supabase
      .from("favourites")
      .select("category, member_id, title, created_at")
      .eq("family_id", activeFamilyId)
      .is("removed_at", null)
      .order("created_at", { ascending: false });

    if (data) {
      const memberSets: Record<string, Set<string>> = {};
      const titlesByCategory: Record<string, string[]> = {};
      for (const row of data) {
        const cat = row.category as string;
        countsByCategory[cat] = (countsByCategory[cat] ?? 0) + 1;
        if (row.member_id) {
          if (!memberSets[cat]) memberSets[cat] = new Set();
          memberSets[cat].add(row.member_id);
        }
        // Collect titles (already ordered by created_at desc)
        if (!titlesByCategory[cat]) titlesByCategory[cat] = [];
        if (titlesByCategory[cat].length < 3) {
          titlesByCategory[cat].push(row.title);
        }
      }
      for (const [cat, set] of Object.entries(memberSets)) {
        memberCountsByCategory[cat] = set.size;
      }
      for (const [cat, titles] of Object.entries(titlesByCategory)) {
        previewsByCategory[cat] = titles;
      }
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        Favourites
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Books, movies, shows, games -- what everyone loves right now.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const itemCount = countsByCategory[cat.id] ?? 0;
          const memberCount = memberCountsByCategory[cat.id] ?? 0;
          const previews = previewsByCategory[cat.id] ?? [];
          return (
            <Link
              key={cat.id}
              href={`/dashboard/favourites/${cat.id}`}
              className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all duration-200 hover:border-[var(--primary)]/40 hover:shadow-md hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <span className="text-3xl" role="img" aria-hidden="true">
                {cat.icon}
              </span>
              <h2 className="mt-4 font-display text-xl font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                {cat.label}
              </h2>
              {itemCount > 0 ? (
                <>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                    {memberCount > 0 &&
                      ` \u00B7 ${memberCount} ${memberCount === 1 ? "member" : "members"}`}
                  </p>
                  {previews.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {previews.slice(0, 2).map((title, i) => (
                        <p key={i} className="line-clamp-1 text-xs text-[var(--muted)]">
                          {title}
                          {i === 1 && previews.length > 2 ? ", ..." : ""}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Nothing yet -- be first
                </p>
              )}
            </Link>
          );
        })}

        <Link
          href="/dashboard/recipes"
          className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all duration-200 hover:border-[var(--accent)]/50 hover:shadow-md hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span className="text-3xl" role="img" aria-hidden="true">
            🍳
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
            Recipes
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            With stories &amp; dinner photos
          </p>
        </Link>
      </div>
    </div>
  );
}
