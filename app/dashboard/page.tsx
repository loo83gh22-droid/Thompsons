import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        Welcome home
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Your family hub. Pick a destination below.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          href="/dashboard/map"
          title="Map"
          description="See where the family has been. Add your own pins."
          icon="🗺️"
        />
        <DashboardCard
          href="/dashboard/journal"
          title="Journal"
          description="Write about trips, birthdays, celebrations. Upload photos, relive memories."
          icon="📔"
        />
        <DashboardCard
          href="/dashboard/photos"
          title="Photos"
          description="Upload photos for the background mosaic on every page."
          icon="🖼️"
        />
        <DashboardCard
          href="/dashboard/sports"
          title="Sports"
          description="Team photos, action shots, and championship moments."
          icon="🏆"
        />
        <DashboardCard
          href="/dashboard/family-tree"
          title="Family Tree"
          description="See how the family connects. Parents, children, and relationships."
          icon="🌳"
        />
        <DashboardCard
          href="/dashboard/favourites"
          title="Favourites"
          description="Books, movies, shows, games, recipes — the stuff we love."
          icon="⭐"
        />
        <DashboardCard
          href="/dashboard/onboarding"
          title="Add family members"
          description="Invite family with name, relationship, and email. They can sign up to join."
          icon="👋"
        />
        <DashboardCard
          href="/dashboard/messages"
          title="Messages"
          description="Send a message that pops up when family logs in. Perfect for Valentine's Day!"
          icon="💌"
        />
        <DashboardCard
          href="/dashboard/death-box"
          title="Da Box"
          description="Sensitive documents and wishes. Password protected."
          icon="📦"
        />
      </div>
    </div>
  );
}

function DashboardCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
    >
      <span className="text-3xl">{icon}</span>
      <h2 className="mt-4 font-display text-xl font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">
        {title}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
    </Link>
  );
}
