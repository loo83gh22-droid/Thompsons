import Link from "next/link";

const CATEGORIES = [
  { id: "books", label: "Books", icon: "📚" },
  { id: "movies", label: "Movies", icon: "🎬" },
  { id: "shows", label: "Shows", icon: "📺" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "podcasts", label: "Podcasts", icon: "🎙️" },
  { id: "games", label: "Games", icon: "🎮" },
] as const;

export default function FavouritesPage() {
  return (
    <div>
      <h1 className="font-display text-4xl font-bold text-[var(--foreground)]">
        Favourites
      </h1>
      <p className="mt-2 text-lg text-[var(--muted)]">
        Books, movies, shows, games — the stuff we love. Pick a category.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-6 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/dashboard/favourites/${cat.id}`}
            className="group block min-h-[44px] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 transition-all duration-200 hover:border-[var(--primary)]/40 hover:shadow-lg hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <span className="text-3xl" role="img" aria-hidden="true">{cat.icon}</span>
            <h2 className="mt-4 font-display text-xl font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)]">
              {cat.label}
            </h2>
          </Link>
        ))}
        <Link
          href="/dashboard/recipes"
          className="group block min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 transition-all duration-200 hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)] hover:shadow-xl hover:shadow-black/25 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span className="text-3xl" role="img" aria-hidden="true">🍳</span>
          <h2 className="mt-4 font-display text-xl font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)]">
            Recipes
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            With stories & dinner photos
          </p>
        </Link>
      </div>
    </div>
  );
}
