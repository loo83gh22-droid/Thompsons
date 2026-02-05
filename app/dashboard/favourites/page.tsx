import Link from "next/link";

const CATEGORIES = [
  { id: "books", label: "Books", icon: "📚" },
  { id: "movies", label: "Movies", icon: "🎬" },
  { id: "shows", label: "Shows", icon: "📺" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "podcasts", label: "Podcasts", icon: "🎙️" },
  { id: "games", label: "Games", icon: "🎮" },
  { id: "recipes", label: "Recipes", icon: "🍳" },
] as const;

export default function FavouritesPage() {
  return (
    <div>
      <h1 className="font-display text-4xl font-bold text-[var(--foreground)]">
        Favourites
      </h1>
      <p className="mt-2 text-lg text-[var(--muted)]">
        Books, movies, shows, games, recipes — the stuff we love. Pick a category.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/dashboard/favourites/${cat.id}`}
            className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
          >
            <span className="text-3xl">{cat.icon}</span>
            <h2 className="mt-4 font-display text-xl font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">
              {cat.label}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
